import { ref } from "vue";

export function useDropdownManager() {
  const openId = ref<string | null>(null);

  const isOpen = (id: string | number) => openId.value === String(id);

  const toggle = (id: string | number, nextState: boolean) => {
    const key = String(id);
    openId.value = nextState ? key : openId.value === key ? null : openId.value;
  };

  return { openId, isOpen, toggle };
}
