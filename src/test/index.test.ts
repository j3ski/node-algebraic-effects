import { expect } from "chai";
import sinon from "sinon";
import { handle, perform } from "..";

const wait = (n: number) => new Promise((resolve) => setTimeout(resolve, n));

describe("node algebraic effects", () => {
  it("should perform the simplest tasks", async () => {
    const expected = 4;

    const actual = await handle(
      async () => {
        const number = await perform("get2");
        const sum = await perform("add2", number);
        return sum;
      },
      {
        get2: () => 2,
        add2: (n: number) => n + 2,
      }
    );

    expect(actual).to.equal(expected);
  });

  it("should perform the simple tasks with async handlers", async () => {
    const expected = { foo: "bar" };

    const actual = await handle(
      async () => {
        const params = (await perform("getParamsFromRequest")) as {
          userId: number;
        };
        const user = await perform("getUser", params.userId);
        return user;
      },
      {
        getParamsFromRequest: () => ({ userId: 1000 }),
        getUser: async (id: number) => {
          await wait(id);
          return expected;
        },
      }
    );

    expect(actual).to.equal(expected);
  });

  it("should not mix concurrent requests", async () => {
    const promises = [];
    for (let i = 1; i <= 1000; i++) {
      promises.push(
        (async () => {
          const expected = { foo: i };

          const actual = await handle(
            async () => {
              await perform("wait");
              const user = await perform("getUser");
              return user;
            },
            {
              wait: () => wait(Math.random() * 1000),
              getUser: () => expected,
            }
          );

          expect(actual).to.equal(expected);
        })()
      );
    }
    await Promise.all(promises);
  });

  it("should be able to perform actions after the function completed", async () => {
    const expected = "foo";

    let actual;
    await handle(
      async () => {
        await perform("setActualResultLater");
        return expected;
      },
      async (resume) => {
        actual = await resume();
      }
    );

    expect(actual).to.equal(expected);
  });

  it("should be able to capture errors", async () => {
    try {
      await handle(
        async () => {
          await perform("foo");
          throw new Error("no unhandled rejections!");
        },
        (resume) => resume()
      );
    } catch (e) {
      expect(e);
    }
  });

  it("should be able to act upon failures", async () => {
    const firstPerformSpy = sinon.spy();
    const secondPerformSpy = sinon.spy();

    try {
      await handle(
        async () => {
          await perform("first");
          await perform("second");
          throw new Error("failed!");
        },
        async (resume, effect) => {
          try {
            await resume();
          } catch (e) {
            switch (effect) {
              case "first":
                firstPerformSpy("first");
                break;
              case "second":
                secondPerformSpy("second");
                break;
            }
          }
        }
      );
    } catch (e) {
      expect(firstPerformSpy).to.be.calledWith("first");
      expect(secondPerformSpy).to.be.calledWith("second");
    }
  });

  it("should handle composition", async () => {
    const expected = 4;

    const inner = async () => {
      const number = await perform("getFromOuterHandle");
      return perform("addInInnerHandle", number);
    };

    const outer = () =>
      handle(inner, {
        addInInnerHandle: (n: number) => n + n,
      });

    const actual = await handle(outer, {
      getFromOuterHandle: () => 2,
    });

    expect(actual).to.be.equal(expected);
  });

  it("should handle composition and not mix contexts", async () => {
    const inner = async () => {
      const number = await perform("getFromOuterHandle");
      return perform("addInInnerHandle", number);
    };

    const outer = async () => {
      const number = await handle(inner, {
        addInInnerHandle: (n: number) => n + n,
      });

      return perform("addInInnerHandle", number);
    };

    try {
      await handle(outer, {
        getFromOuterHandle: () => 2,
      });
      expect(true).to.be.false;
    } catch (e) {
      expect(e.message).to.be.equal(
        "Your effect handler MUST call continue. Unhandled effect addInInnerHandle"
      );
    }
  });
});
