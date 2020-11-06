import { asyncStorage } from "./asyncStorage";

export const perform = (effectName: string, ...args: any) => {
  const store = asyncStorage.getStore() as any;

  if (!store) {
    throw new Error("Perform must be called in a function wrapped by handle");
  }

  const { handle, donePromise } = store;

  return new Promise(async (resolve, reject) => {
    const resume: Function & { resolved?: boolean } = (result: unknown) => {
      resume.resolved = true;
      resolve(result);
      return donePromise;
    };
    await handle(resume, effectName, ...args);
    if (!resume.resolved) {
      reject(
        new Error(
          `Your effect handler MUST call continue. Unhandled effect ${effectName}`
        )
      );
    }
  });
};
