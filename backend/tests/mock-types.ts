import type { jest } from "@jest/globals";

/**
 * A mock typed against a real function's parameters (so `toHaveBeenCalledWith(...)` catches
 * arity/type mistakes) while leaving the resolved/returned value untyped, so fixtures don't have
 * to reconstruct every column of the real DB row — only the fields the test actually cares about.
 */
export type MockOf<F extends (...args: any) => any> = jest.Mock<(...args: Parameters<F>) => any>;
