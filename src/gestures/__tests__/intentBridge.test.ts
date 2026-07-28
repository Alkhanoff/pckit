import { dispatchIntent, hasIntentDispatcher, setIntentDispatcher } from '@/gestures/intentBridge';

/**
 * Körpü — UI thread ilə domain arasındakı yeganə keçid.
 * `runOnJS` bütün layihədə yalnız `intentBridge.ts`-dədir (ESLint qaydası).
 */

afterEach(() => setIntentDispatcher(undefined));

describe('intent körpüsü', () => {
  it('başlanğıcda dispatcher yoxdur', () => {
    expect(hasIntentDispatcher()).toBe(false);
  });

  it('qeydiyyatdan keçən dispatcher intent alır', () => {
    const received: string[] = [];
    setIntentDispatcher((intent) => received.push(intent.type));

    dispatchIntent({ type: 'materialGrabbed' });
    dispatchIntent({ type: 'cutCompleted' });

    expect(received).toEqual(['materialGrabbed', 'cutCompleted']);
  });

  it('dispatcher yoxdursa intent SƏSSİZCƏ atılır — crash yoxdur', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(() => dispatchIntent({ type: 'materialGrabbed' })).not.toThrow();
    warn.mockRestore();
  });

  it('dispatcher dəyişdirilə bilir', () => {
    const first: string[] = [];
    const second: string[] = [];

    setIntentDispatcher((i) => first.push(i.type));
    dispatchIntent({ type: 'materialGrabbed' });

    setIntentDispatcher((i) => second.push(i.type));
    dispatchIntent({ type: 'materialReleased' });

    expect(first).toEqual(['materialGrabbed']);
    expect(second).toEqual(['materialReleased']);
  });

  it('undefined ilə qeydiyyat ləğv edilir', () => {
    setIntentDispatcher(() => {});
    expect(hasIntentDispatcher()).toBe(true);

    setIntentDispatcher(undefined);
    expect(hasIntentDispatcher()).toBe(false);
  });

  it('intent obyekti dəyişdirilmədən ötürülür', () => {
    const received: unknown[] = [];
    setIntentDispatcher((intent) => received.push(intent));

    const intent = { type: 'tensionStateChanged', tension: 'optimal' } as const;
    dispatchIntent(intent);

    expect(received[0]).toEqual(intent);
  });
});
