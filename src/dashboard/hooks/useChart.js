import { useRef, useEffect } from 'react';

/**
 * Manages a Chart.js instance tied to a canvas ref.
 * @param {Function} buildConfig – returns a Chart.js config object
 * @param {Array}    deps       – triggers rebuild when any dep changes
 */
export function useChart(buildConfig, deps) {
    const canvasRef = useRef(null);
    const chartRef  = useRef(null);

    useEffect(() => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;

        chartRef.current?.destroy();
        chartRef.current = new window.Chart(ctx, buildConfig());

        return () => {
            chartRef.current?.destroy();
            chartRef.current = null;
        };
    }, deps); // eslint-disable-line react-hooks/exhaustive-deps

    return canvasRef;
}
