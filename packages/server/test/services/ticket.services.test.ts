import { describe, it, expect, vi, beforeEach } from "vitest";

function makeConn() {
  return {
    beginTransaction: vi.fn(),
    execute: vi.fn(),
    query: vi.fn(),
    commit: vi.fn(),
    rollback: vi.fn(),
    release: vi.fn(),
  };
}

let conn = makeConn();
const getConnectionMock = vi.fn(() => conn);
vi.mock("src/db/database", () => ({
  pool: { getConnection: getConnectionMock },
}));

const { default: TicketService, MAX_RESERVE_QUANTITY } = await import("@services/ticket.services");

describe("TicketService.reserve", () => {
  beforeEach(() => {
    conn = makeConn();
    getConnectionMock.mockImplementation(() => conn);
  });

  it("reserves several tickets in one call with consecutive ids", async () => {
    conn.execute.mockResolvedValueOnce([{ affectedRows: 1 }]); // capacity UPDATE
    conn.query.mockResolvedValueOnce([{ insertId: 100 }]); // bulk INSERT

    const tickets = await TicketService.reserve(7, 42, 3);

    expect(tickets).toHaveLength(3);
    expect(tickets.map((t) => t.Id)).toEqual([100, 101, 102]);
    expect(tickets.every((t) => t.TicketTypeId === 7 && t.UserId === 42)).toBe(true);

    const [updateSql, updateParams] = conn.execute.mock.calls[0] as [string, unknown[]];
    expect(updateSql).toContain("availableCapacity - ?");
    expect(updateParams).toEqual([3, 7, 3]);

    const [insertSql, insertParams] = conn.query.mock.calls[0] as [string, unknown[]];
    expect(insertSql).toContain("INSERT INTO tickets");
    expect((insertParams[0] as unknown[])).toHaveLength(3);

    expect(conn.commit).toHaveBeenCalledTimes(1);
    expect(conn.rollback).not.toHaveBeenCalled();
    expect(conn.release).toHaveBeenCalledTimes(1);
  });

  it("defaults to a single ticket when no quantity is given", async () => {
    conn.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);
    conn.query.mockResolvedValueOnce([{ insertId: 5 }]);

    const tickets = await TicketService.reserve(1, 1);

    expect(tickets).toHaveLength(1);
    const [, updateParams] = conn.execute.mock.calls[0] as [string, unknown[]];
    expect(updateParams).toEqual([1, 1, 1]);
  });

  it("rolls back and throws when there isn't enough capacity for the requested quantity", async () => {
    conn.execute.mockResolvedValueOnce([{ affectedRows: 0 }]);

    await expect(TicketService.reserve(7, 42, 5)).rejects.toThrow("Not enough tickets available for this type");

    expect(conn.rollback).toHaveBeenCalledTimes(1);
    expect(conn.query).not.toHaveBeenCalled();
    expect(conn.commit).not.toHaveBeenCalled();
  });

  it("exposes the same cap the controller validates against", () => {
    expect(MAX_RESERVE_QUANTITY).toBeGreaterThan(0);
  });
});
