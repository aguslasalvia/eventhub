import { describe, it, mock, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { TicketStatus } from "@eventhub/shared/enums/tickets";
import { pool } from "../../src/db/database";
import TicketService, { MAX_RESERVE_QUANTITY } from "../../src/services/ticket.services";

function makeConn() {
  return {
    beginTransaction: async () => { },
    execute: async (..._args: unknown[]) => [{}],
    query: async (..._args: unknown[]) => [{}],
    commit: async () => { },
    rollback: async () => { },
    release: () => { },
  };
}

describe("TicketService.reserve", () => {
  beforeEach(() => {
    mock.restoreAll();
  });

  it("reserves several tickets in one call with consecutive ids", async () => {
    const conn = makeConn();
    const executeMock = mock.method(conn, "execute", async () => [{ affectedRows: 1 }]);
    const queryMock = mock.method(conn, "query", async () => [{ insertId: 100 }]);
    mock.method(pool, "getConnection", async () => conn);

    const tickets = await TicketService.reserve(7, 42, 3);

    assert.equal(tickets.length, 3);
    assert.deepEqual(tickets.map((t) => t.Id), [100, 101, 102]);
    assert.ok(tickets.every((t) => t.TicketTypeId === 7 && t.UserId === 42));

    const [updateSql, updateParams] = executeMock.mock.calls[0]!.arguments as [string, unknown[]];
    assert.ok(updateSql.includes("availableCapacity - ?"));
    assert.deepEqual(updateParams, [3, 7, 3]);

    const [insertSql, insertParams] = queryMock.mock.calls[0]!.arguments as [string, unknown[]];
    assert.ok(insertSql.includes("INSERT INTO tickets"));
    assert.equal((insertParams[0] as unknown[]).length, 3);
  });

  it("defaults to a single ticket when no quantity is given", async () => {
    const conn = makeConn();
    const executeMock = mock.method(conn, "execute", async () => [{ affectedRows: 1 }]);
    mock.method(conn, "query", async () => [{ insertId: 5 }]);
    mock.method(pool, "getConnection", async () => conn);

    const tickets = await TicketService.reserve(1, 1);

    assert.equal(tickets.length, 1);
    const [, updateParams] = executeMock.mock.calls[0]!.arguments as [string, unknown[]];
    assert.deepEqual(updateParams, [1, 1, 1]);
  });

  it("rolls back when there isn't enough capacity", async () => {
    const conn = makeConn();
    mock.method(conn, "execute", async () => [{ affectedRows: 0 }]);
    const rollbackMock = mock.method(conn, "rollback", async () => { });
    mock.method(pool, "getConnection", async () => conn);

    await assert.rejects(
      () => TicketService.reserve(7, 42, 5),
      /Not enough tickets available/,
    );

    assert.equal(rollbackMock.mock.calls.length, 1);
  });

  it("exposes the same cap the controller validates against", () => {
    assert.ok(MAX_RESERVE_QUANTITY > 0);
  });
});

function reservedRow(id: number) {
  return {
    id,
    ticketTypeId: 7,
    userId: 42,
    qrCode: null,
    status: TicketStatus.Reserved,
    purchaseDate: null,
    reservationExpiresAt: new Date(Date.now() + 60_000),
  };
}

describe("TicketService.confirmMany", () => {
  beforeEach(() => {
    mock.restoreAll();
  });

  it("confirms every ticket in one transaction", async () => {
    const conn = makeConn();
    const responses = [
      [[reservedRow(1)]],
      [{}],
      [[reservedRow(2)]],
      [{}],
    ];
    let call = 0;
    mock.method(conn, "execute", async () => responses[call++]);
    const commitMock = mock.method(conn, "commit", async () => { });
    mock.method(pool, "getConnection", async () => conn);

    const tickets = await TicketService.confirmMany([1, 2]);

    assert.equal(tickets.length, 2);
    assert.ok(tickets.every((t) => t.Status === TicketStatus.Confirmed && t.QrCode));
    assert.equal(commitMock.mock.calls.length, 1);
  });

  it("rolls back everything if one ticket in the batch fails", async () => {
    const conn = makeConn();
    const responses = [
      [[reservedRow(1)]],
      [{}],
      [[]], // ticket 2 not found
    ];
    let call = 0;
    mock.method(conn, "execute", async () => responses[call++]);
    const rollbackMock = mock.method(conn, "rollback", async () => { });
    mock.method(pool, "getConnection", async () => conn);

    await assert.rejects(
      () => TicketService.confirmMany([1, 2]),
      /Ticket 2 not found/,
    );

    assert.equal(rollbackMock.mock.calls.length, 1);
  });
});
