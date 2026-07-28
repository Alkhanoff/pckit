import { FIXED_SEQUENCE } from '@/data/orders';
import { RECIPE_PHONE_BOX_STRETCH_FILM, findRecipe } from '@/data/recipes';
import { useGameplayStore, resetGameplayStore } from '@/stores/useGameplayStore';
import { useOrderStore, resetOrderStore } from '@/stores/useOrderStore';
import { useProgressionStore, resetProgressionStore } from '@/stores/useProgressionStore';
import { createId, resetIdCounter } from '@/utils/id';

/**
 * Orders → Material Select → Gameplay axını.
 *
 * Ekran komponentləri deyil, axının STATE tərəfi test edilir — bu, həm
 * daha sürətlidir, həm də naviqasiya kitabxanasından asılı deyil.
 */

beforeEach(() => {
  resetOrderStore();
  resetGameplayStore();
  resetProgressionStore();
  resetIdCounter();
});

/** `useStartOrder` hookunun məntiqi — React-dən kənar. */
function startOrder(): string | undefined {
  const { activeOrder, selectedMaterialId } = useOrderStore.getState();
  if (!activeOrder || !selectedMaterialId) return undefined;

  const recipe = findRecipe(activeOrder.recipeId.split('__')[0], selectedMaterialId);
  if (!recipe) return undefined;

  const sessionId = createId('session');
  useGameplayStore.getState().start({
    sessionId,
    recipe,
    customerPriority: activeOrder.customerPriority,
    isTutorial: activeOrder.isTutorial ?? false,
  });
  return sessionId;
}

describe('sifariş axını', () => {
  it('tam axın: sifariş seç → material seç → sessiya yarat', () => {
    useOrderStore
      .getState()
      .refreshBoard({ completedCount: 0 }, [RECIPE_PHONE_BOX_STRETCH_FILM.id]);

    const board = useOrderStore.getState().board;
    expect(board.length).toBeGreaterThan(0);

    useOrderStore.getState().selectOrder(board[0]);
    useOrderStore.getState().selectMaterial('stretch-film');

    const sessionId = startOrder();
    expect(sessionId).toBeDefined();

    const session = useGameplayStore.getState().session;
    expect(session?.sessionId).toBe(sessionId);
    expect(session?.productId).toBe('phone-box');
    expect(session?.materialId).toBe('stretch-film');
    expect(session?.state).toBe('preparing');
  });

  it('tutorial sifarişi sessiyaya ötürülür', () => {
    useOrderStore.getState().selectOrder(FIXED_SEQUENCE[0]);
    useOrderStore.getState().selectMaterial('stretch-film');
    startOrder();

    expect(useGameplayStore.getState().session?.isTutorial).toBe(true);
    // Tutorial-da material cəzası yoxdur
    expect(useGameplayStore.getState().session?.suitability).toBe('ideal');
  });

  it('material seçilmədən sessiya yaranmır', () => {
    useOrderStore.getState().selectOrder(FIXED_SEQUENCE[0]);
    expect(startOrder()).toBeUndefined();
    expect(useGameplayStore.getState().session).toBeUndefined();
  });

  it('sifariş seçilmədən sessiya yaranmır', () => {
    useOrderStore.getState().selectMaterial('stretch-film');
    expect(startOrder()).toBeUndefined();
  });

  it('recipe-i olmayan material sessiya yaratmır və CRASH ETMİR', () => {
    useOrderStore.getState().selectOrder(FIXED_SEQUENCE[0]);
    useOrderStore.getState().selectMaterial('foil');

    expect(() => startOrder()).not.toThrow();
    expect(startOrder()).toBeUndefined();
  });

  it('hər sessiya unikal id alır', () => {
    useOrderStore.getState().selectOrder(FIXED_SEQUENCE[0]);
    useOrderStore.getState().selectMaterial('stretch-film');

    const first = startOrder();
    const second = startOrder();
    expect(first).not.toBe(second);
  });
});

describe('geri naviqasiya state-i pozmur', () => {
  it('sifariş seçimi material ekranından qayıdanda qalır', () => {
    useOrderStore.getState().selectOrder(FIXED_SEQUENCE[0]);
    useOrderStore.getState().selectMaterial('stretch-film');

    // Orders ekranına qayıdış — board yenilənir, seçim silinmir
    useOrderStore
      .getState()
      .refreshBoard({ completedCount: 0 }, [RECIPE_PHONE_BOX_STRETCH_FILM.id]);

    expect(useOrderStore.getState().activeOrder?.id).toBe(FIXED_SEQUENCE[0].id);
    expect(useOrderStore.getState().selectedMaterialId).toBe('stretch-film');
  });

  it('başqa sifariş seçmək material seçimini təmizləyir', () => {
    useOrderStore.getState().selectOrder(FIXED_SEQUENCE[0]);
    useOrderStore.getState().selectMaterial('stretch-film');
    useOrderStore.getState().selectOrder({ ...FIXED_SEQUENCE[0], id: 'basqa' });

    expect(useOrderStore.getState().selectedMaterialId).toBeUndefined();
  });

  it('nəticədən sonra təmizləmə sessiyanı və seçimi sıfırlayır', () => {
    useOrderStore.getState().selectOrder(FIXED_SEQUENCE[0]);
    useOrderStore.getState().selectMaterial('stretch-film');
    startOrder();

    useGameplayStore.getState().end();
    useOrderStore.getState().clearSelection();

    expect(useGameplayStore.getState().session).toBeUndefined();
    expect(useOrderStore.getState().activeOrder).toBeUndefined();
  });
});

describe('sifariş pool-u açılmış məhsullara bağlıdır', () => {
  it('açılmamış məhsulun recipe-i board-a düşmür', () => {
    useOrderStore.getState().refreshBoard({ completedCount: 0 }, []);
    expect(useOrderStore.getState().board).toHaveLength(0);
  });

  it('başlanğıc profilində telefon qutusu sifarişi görünür', () => {
    const unlocked = useProgressionStore.getState().unlockedProducts;
    expect(unlocked).toContain('phone-box');

    useOrderStore
      .getState()
      .refreshBoard({ completedCount: 0 }, [RECIPE_PHONE_BOX_STRETCH_FILM.id]);
    expect(useOrderStore.getState().board.length).toBeGreaterThan(0);
  });
});
