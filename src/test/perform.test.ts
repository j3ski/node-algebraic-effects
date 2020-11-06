import { asyncStorage } from "../asyncStorage";
import { expect } from "chai";
import { perform } from "../perform";

describe("perform", () => {
  it("should throw an error if called outside of the handle", async () => {
    try {
      await perform("foo!");
      expect(true).to.be.false;
    } catch (e) {
      expect(e.message).to.be.equal(
        "Perform must be called in a function wrapped by handle"
      );
    }
  });

  it("should throw an error if the handler doesn't call continue", async () => {
    try {
      await asyncStorage.run(
        {
          handle: () => {},
        },
        async () => {
          await perform("foo!");
        }
      );
      expect(true).to.be.false;
    } catch (e) {
      expect(e.message).to.be.equal(
        "Your effect handler MUST call continue. Unhandled effect foo!"
      );
    }
  });

  it("should return the value provided by the handler", async () => {
    const expected = "foo";

    await asyncStorage.run(
      { handle: (cont: Function) => cont(expected) },
      async () => {
        const actual = await perform("effect");

        expect(actual).to.be.equal(expected);
      }
    );
  });
});
