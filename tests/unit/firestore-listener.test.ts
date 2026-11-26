import { FirebaseError } from 'firebase/app';
import type { Query, QuerySnapshot } from 'firebase/firestore';
import { subscribeToQuery } from '@/lib/subscribeToQuery';

let mockNext: (snapshot: QuerySnapshot) => void;
let mockError: (error: unknown) => void;
const mockUnsubscribe = jest.fn();
jest.mock('firebase/firestore', () => ({
  onSnapshot: jest.fn((_query, _options, next, error) => { mockNext = next; mockError = error; return mockUnsubscribe; }),
}));
const query = {} as Query;
const snapshot = (fromCache: boolean) => ({ metadata: { fromCache }, docs: [] }) as unknown as QuerySnapshot;

describe('Połączenie z Firestore', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => { jest.clearAllTimers(); jest.useRealTimers(); });
  test('nie traktuje pustego cache jako potwierdzonego braku danych', () => {
    const next = jest.fn(), error = jest.fn();
    const stop = subscribeToQuery(query, next, error);
    mockNext(snapshot(true));
    expect(next).not.toHaveBeenCalled();
    jest.advanceTimersByTime(15000);
    expect(error).toHaveBeenCalledWith(expect.objectContaining({ code: 'unavailable' }));
    mockNext(snapshot(false));
    expect(next).toHaveBeenCalledTimes(1);
    stop();
  });
  test('zachowuje właściwy błąd uprawnień zamiast późniejszego timeoutu', () => {
    const error = jest.fn();
    const stop = subscribeToQuery(query, jest.fn(), error);
    mockError(new FirebaseError('permission-denied', 'Denied'));
    jest.advanceTimersByTime(30000);
    expect(error).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledWith(expect.objectContaining({ code: 'permission-denied' }));
    stop();
  });
  test('po odsubskrybowaniu nie aktualizuje nieaktywnego ekranu', () => {
    const next = jest.fn(), error = jest.fn();
    subscribeToQuery(query, next, error)();
    mockNext(snapshot(false)); jest.advanceTimersByTime(30000);
    expect(next).not.toHaveBeenCalled(); expect(error).not.toHaveBeenCalled(); expect(mockUnsubscribe).toHaveBeenCalled();
  });
});
