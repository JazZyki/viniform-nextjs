'use client';

import React, { useRef, useEffect, useState } from 'react';

const SignaturePad = ({ width = 500, height = 200, correctionX = 0, correctionY = 0 }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const handleMouseDown = (e) => {
            setIsDrawing(true);
            ctx.beginPath();
            ctx.moveTo(
                e.pageX - canvas.offsetLeft + correctionX,
                e.pageY - canvas.offsetTop + correctionY
            );
        };

        const handleMouseUp = () => {
            setIsDrawing(false);
            ctx.beginPath();
        };

        const handleMouseMove = (e) => {
            if (!isDrawing) return;
            ctx.lineTo(
                e.pageX - canvas.offsetLeft + correctionX,
                e.pageY - canvas.offsetTop + correctionY
            );
            ctx.lineWidth = 5;
            ctx.strokeStyle = '#000';
            ctx.stroke();
        };

        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            canvas.removeEventListener('mousedown', handleMouseDown);
            canvas.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDrawing, correctionX, correctionY]);

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="border border-black rounded"
        />
    );
};

export default SignaturePad;