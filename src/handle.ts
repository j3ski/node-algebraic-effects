import { asyncStorage } from "./asyncStorage";

type Resume = ((returnValue?: unknown) => void) & { resolved?: boolean };

type EffectHandler = (resume: Resume, effectType: string, ...args: any) => void;

type ResolutionHanndler = (v: unknown) => void;

const createEffectHandler = (
  handlers: Record<string, Function>
): EffectHandler => async (resume, effectType, ...args) => {
  const handler = handlers[effectType];
  if (!handler) {
    return;
  }
  resume(await handler(...args));
};

const mergeEffectHandlers = (
  ...effectHandlers: EffectHandler[]
): EffectHandler => async (resume, ...rest) => {
  for (const effectHandler of effectHandlers) {
    await effectHandler(resume, ...rest);
    if (resume.resolved) {
      return;
    }
  }
};

export const handle = async (
  cb: () => unknown,
  effectHandlerConfig: EffectHandler | Record<string, Function>
) => {
  let res: ResolutionHanndler = () => {};
  let rej: ResolutionHanndler = () => {};

  const donePromise = new Promise((resolve, reject) => {
    res = resolve;
    rej = reject;
  });

  const handleEffect =
    typeof effectHandlerConfig === "function"
      ? effectHandlerConfig
      : createEffectHandler(effectHandlerConfig);

  const store = asyncStorage.getStore() as any;

  const effectHandler: EffectHandler = store
    ? mergeEffectHandlers(handleEffect, store.handle)
    : handleEffect;

  try {
    const result = await asyncStorage.run(
      { handle: effectHandler, donePromise },
      cb
    );
    res(result);

    return result;
  } catch (e) {
    rej(e);
    throw e;
  }
};
