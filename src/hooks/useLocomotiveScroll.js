import { useEffect } from 'react';

export default function useLocomotiveScroll(start) {
    useEffect(() => {
        if (!start) return;

        let scroll;
        import('locomotive-scroll').then((LocomotiveScroll) => {
            const scrollEl = document.querySelector('[data-scroll-container]');

            if (scrollEl) {
                scroll = new LocomotiveScroll.default({
                    el: scrollEl,
                    smooth: true,
                    multiplier: 1,
                    class: 'is-reveal',
                });
            }
        });

        return () => {
            if (scroll) scroll.destroy();
        };
    }, [start]);
}
