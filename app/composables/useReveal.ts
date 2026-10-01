import type { ShallowRef } from 'vue';

/* Появление блоков при прокрутке на GSAP ScrollTrigger.

   - gsap грузится динамическим import() после монтирования: в SSR-бандл и в чанк
     страницы он не попадает, а на страницах без анимации не грузится вовсе;
   - анимации живут в gsap.context и снимаются revert() при размонтировании —
     иначе ScrollTrigger'ы копятся с каждым переходом между страницами;
   - прячем только блоки ниже экрана: то, что человек уже видит, не мигает
     (контент из SSR был бы виден → пропал → проявился);
   - при prefers-reduced-motion не анимируем ничего;
   - цели ищем внутри root, а не во всём документе: при переходе между
     страницами в DOM живут обе. */
export function useReveal(
  root: Readonly<ShallowRef<HTMLElement | null>>,
  selector = '[data-reveal]',
) {
  let revert: (() => void) | undefined;
  let unmounted = false;

  onMounted(async () => {
    const host = root.value;
    if (!host || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const targets = [...host.querySelectorAll<HTMLElement>(selector)].filter(
      (element) => element.getBoundingClientRect().top > window.innerHeight,
    );
    if (!targets.length) return;

    const [{ gsap }, { ScrollTrigger }] = await Promise.all([
      import('gsap'),
      import('gsap/ScrollTrigger'),
    ]);
    if (unmounted) return;

    gsap.registerPlugin(ScrollTrigger);

    const context = gsap.context(() => {
      gsap.set(targets, { autoAlpha: 0, y: 16 });
      ScrollTrigger.batch(targets, {
        start: 'top 90%',
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.06 }),
      });
    }, host);

    revert = () => context.revert();
  });

  onBeforeUnmount(() => {
    unmounted = true;
    revert?.();
  });
}
