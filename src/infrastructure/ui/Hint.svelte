<script lang="ts">
  type Props = {
    /** Texto de ayuda (tooltip) */
    text: string;
    /** Clase extra opcional */
    class?: string;
  };
  let { text, class: className = '' }: Props = $props();
</script>

<span
  class="bo-hint {className}"
  data-tip={text}
  tabindex="0"
  role="img"
  aria-label={text}
>i</span>
