import { useEffect, useRef } from 'react';
import { animate, stagger } from 'animejs';

export function usePageAnimation() {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    animate(ref.current, {
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 400,
      ease: 'outQuad'
    });
  }, []);

  return ref;
}

export function useStaggerAnimation(selector, deps = []) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const elements = ref.current.querySelectorAll(selector);
    if (!elements.length) return;
    animate(elements, {
      opacity: [0, 1],
      translateY: [30, 0],
      scale: [0.95, 1],
      duration: 400,
      delay: stagger(60),
      ease: 'outQuad'
    });
  }, deps);

  return ref;
}

export function useCountUp(targetValue, duration = 1200) {
  const ref = useRef(null);
  const valRef = useRef({ val: 0 });

  useEffect(() => {
    if (!ref.current || typeof targetValue !== 'number') return;
    valRef.current.val = 0;
    const el = ref.current;
    const anim = animate(valRef.current, {
      val: targetValue,
      duration,
      ease: 'outExpo',
      onUpdate: () => {
        if (el) el.textContent = Math.round(valRef.current.val);
      }
    });
    return () => anim.cancel();
  }, [targetValue, duration]);

  return ref;
}

export function animateCards(container) {
  if (!container) return;
  const cards = container.querySelectorAll('.card, .subject-card, .exam-card, .stat-card, .schedule-item, .sp-card');
  if (!cards.length) return;
  animate(cards, {
    opacity: [0, 1],
    translateY: [25, 0],
    scale: [0.96, 1],
    duration: 350,
    delay: stagger(50),
    ease: 'outQuad'
  });
}

export function animatePageIn(container) {
  if (!container) return;
  animate(container, {
    opacity: [0, 1],
    translateY: [15, 0],
    duration: 300,
    ease: 'outQuad',
    onComplete: () => animateCards(container)
  });
}

export function animateModal(modalContent) {
  if (!modalContent) return;
  animate(modalContent, {
    scale: [0.85, 1],
    opacity: [0, 1],
    duration: 250,
    ease: 'outBack(1.7)'
  });
}

export function animateToast(el) {
  if (!el) return;
  animate(el, {
    translateY: [60, 0],
    scale: [0.9, 1],
    duration: 400,
    ease: 'outBack(1.4)'
  });
}

export function animateChatMessage(el) {
  if (!el) return;
  animate(el, {
    opacity: [0, 1],
    translateY: [20, 0],
    scale: [0.95, 1],
    duration: 350,
    ease: 'outQuad'
  });
}

export function animateHero(el) {
  if (!el) return;
  animate(el, {
    scale: [0.5, 1],
    opacity: [0, 1],
    duration: 600,
    ease: 'outBack(1.5)'
  });
}
