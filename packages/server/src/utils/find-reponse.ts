import type { Response } from "express";


/**
 * Responds with the given resource as JSON (200), or a 404 error if
 * the resource is null/undefined. Meant to standardize the common
 * "found vs not found" response pattern across controllers.
 *
 * @param res -> the Express response object
 * @param resource -> the resource to send, or null/undefined if not found
 * @param notFoundMessage -> custom message for the 404 response (defaults to "Not found")
 * @returns -> the Express Response, so it can be returned directly from a controller
 */
export function foundResponse<T>(res: Response, resource: T | null, notFoundMessage = "Not found"): Response {
  return !resource
    ? res.status(404).json({ error: notFoundMessage })
    : res.status(200).json(resource);
}