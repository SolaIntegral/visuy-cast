'use client';

import React, { useRef, useEffect, useState } from 'react';
import { LoadData } from '@/types';

interface QuadrantMappingProps {
  value: LoadData;
  onChange: (value: LoadData) => void;
  size?: number;
}

export default function QuadrantMapping({ 
  value, 
  onChange, 
  size = 400 
}: QuadrantMappingProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const centerX = size / 2;
  const centerY = size / 2;
  const maxRadius = size / 2 - 40;

  // 座標から負荷データへの変換
  const positionToLoadData = (x: number, y: number): LoadData => {
    const dx = x - centerX;
    const dy = centerY - y; // Y軸を反転
    const distance = Math.sqrt(dx * dx + dy * dy);
    const intensity = Math.min(distance / maxRadius, 1);
    
    return {
      activity: dx / maxRadius, // -1 to 1 (インプット to アウトプット)
      emotional: dy / maxRadius, // -1 to 1 (ネガティブ to ポジティブ)
      intensity: intensity,
    };
  };

  // 負荷データから座標への変換
  const loadDataToPosition = (load: LoadData): { x: number; y: number } => {
    const radius = load.intensity * maxRadius;
    const x = centerX + load.activity * maxRadius;
    const y = centerY - load.emotional * maxRadius; // Y軸を反転
    return { x, y };
  };

  // キャンバスの描画
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // キャンバスをクリア
    ctx.clearRect(0, 0, size, size);

    // 背景の円（負荷の強さを示す同心円）
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, (maxRadius / 3) * i, 0, 2 * Math.PI);
      ctx.stroke();
    }

    // 軸の描画
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 2;
    
    // 縦軸（感情）
    ctx.beginPath();
    ctx.moveTo(centerX, 20);
    ctx.lineTo(centerX, size - 20);
    ctx.stroke();
    
    // 横軸（活動）
    ctx.beginPath();
    ctx.moveTo(20, centerY);
    ctx.lineTo(size - 20, centerY);
    ctx.stroke();

    // ラベルの描画
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '300 14px "Noto Sans JP", sans-serif';
    ctx.textAlign = 'center';
    
    // 上：ポジティブ
    ctx.fillText('ポジティブ', centerX, 15);
    // 下：ネガティブ
    ctx.fillText('ネガティブ', centerX, size - 5);
    // 左：インプット
    ctx.save();
    ctx.translate(10, centerY);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('インプット', 0, 0);
    ctx.restore();
    // 右：アウトプット
    ctx.save();
    ctx.translate(size - 10, centerY);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('アウトプット', 0, 0);
    ctx.restore();

    // 現在の位置を示す点
    const pos = loadDataToPosition(value);
    
    // グラデーションで色を変える
    const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 15);
    const intensity = value.intensity;
    
    // 透明感のある白色
    gradient.addColorStop(0, `rgba(255, 255, 255, ${0.9 * intensity})`);
    gradient.addColorStop(1, `rgba(255, 255, 255, ${0.3 * intensity})`);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 15, 0, 2 * Math.PI);
    ctx.fill();
    
    // 境界線
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 15, 0, 2 * Math.PI);
    ctx.stroke();

    // 中心からの線
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  // マウス/タッチイベントの処理
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    updatePosition(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      updatePosition(e);
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const updatePosition = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newLoadData = positionToLoadData(x, y);
    onChange(newLoadData);
  };

  useEffect(() => {
    draw();
  }, [value, size]);

  return (
    <div className="flex flex-col items-center space-y-4">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="border border-white/20 rounded-2xl cursor-pointer backdrop-blur-sm bg-white/5"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
      
      <div className="backdrop-blur-sm bg-white/5 border border-white/20 rounded-2xl p-4 w-full max-w-md">
        <h3 className="text-sm font-light text-white/90 mb-2">負荷の詳細</h3>
        <div className="space-y-2 text-sm text-white/80 font-light">
          <div className="flex justify-between">
            <span>感情:</span>
            <span className="font-normal">
              {value.emotional > 0 ? 'ポジティブ' : 'ネガティブ'} 
              ({Math.abs(value.emotional * 100).toFixed(0)}%)
            </span>
          </div>
          <div className="flex justify-between">
            <span>活動:</span>
            <span className="font-normal">
              {value.activity > 0 ? 'アウトプット' : 'インプット'} 
              ({Math.abs(value.activity * 100).toFixed(0)}%)
            </span>
          </div>
          <div className="flex justify-between">
            <span>負荷の強さ:</span>
            <span className="font-normal">{(value.intensity * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

