<script setup lang="ts">
const model = defineModel<string>({ default: '' });

withDefaults(
  defineProps<{
    /** Подпись обязательна: без неё у поля нет доступного имени, placeholder его не заменяет. */
    label: string;
    /** Подпись только для скринридера — когда смысл поля ясен из контекста (поиск). */
    hideLabel?: boolean;
    type?: 'text' | 'email' | 'tel' | 'search';
    placeholder?: string;
    error?: string;
    required?: boolean;
    autocomplete?: string;
  }>(),
  { hideLabel: false, type: 'text', error: '', required: false },
);

const slots = defineSlots<{ icon?: () => unknown }>();
const id = useId();
</script>

<template>
  <div class="_Field">
    <label :for="id" class="_Label" :class="{ 'visually-hidden': hideLabel }">
      {{ label }}
      <span v-if="required" class="_Required" aria-hidden="true">*</span>
    </label>

    <div class="_Control">
      <span v-if="slots.icon" class="_Icon"><slot name="icon" /></span>

      <input
        :id="id"
        v-model="model"
        class="_Input"
        :class="{ '_Input--error': error, '_Input--with-icon': Boolean(slots.icon) }"
        :type="type"
        :placeholder="placeholder"
        :required="required"
        :autocomplete="autocomplete"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="error ? `${id}-error` : undefined"
      />
    </div>

    <!-- Ошибка текстом, а не только красной рамкой: без цвета рамка неразличима,
         а aria-invalid сам по себе ничего не объясняет. -->
    <p v-if="error" :id="`${id}-error`" class="_Error">{{ error }}</p>
  </div>
</template>

<style scoped lang="scss">
._Field {
  display: flex;
  flex-direction: column;
  gap: var(--gap-8);
}

._Label {
  font-size: 14px;
  color: var(--text-secondary);
}

._Required {
  color: var(--danger);
}

._Control {
  position: relative;
}

._Icon {
  position: absolute;
  top: 50%;
  left: var(--gap-16);
  display: flex;
  color: var(--text-muted);
  transform: translateY(-50%);
  pointer-events: none;
}

._Input {
  width: 100%;
  min-height: var(--ui-height-44);
  padding: 0 var(--gap-16);
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text-primary);

  &::placeholder {
    color: var(--placeholder);
  }

  &--with-icon {
    padding-left: calc(var(--gap-16) * 2 + 16px);
  }

  &--error {
    border-color: var(--danger);
  }
}

._Error {
  font-size: 13px;
  color: var(--danger);
}
</style>
