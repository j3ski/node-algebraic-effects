import { expect } from "chai";
import { handle } from "../handle";

describe("handle", () => {
  it("should return the same value", async () => {
    const expected = "foo";

    const cb = async () => expected;
    const effectHandler = () => {};

    const actual = await handle(cb, effectHandler);

    expect(actual).to.be.equal(expected);
  });
});
