import { installBeforeUnload } from './before-unload.helper';

describe('installBeforeUnload', () => {
  it('should attach and remove beforeunload event listener', () => {
    let addCalls = 0;
    let removeCalls = 0;

    const originalAdd = window.addEventListener;
    const originalRemove = window.removeEventListener;

    window.addEventListener = (type: string) => {
      if (type === 'beforeunload') addCalls++;
    };
    window.removeEventListener = (type: string) => {
      if (type === 'beforeunload') removeCalls++;
    };

    const cleanup = installBeforeUnload(() => true);
    expect(addCalls).toBe(1);

    cleanup();
    expect(removeCalls).toBe(1);

    window.addEventListener = originalAdd;
    window.removeEventListener = originalRemove;
  });
});
