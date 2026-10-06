'use client';

import React, { memo } from 'react';

const CAROUSEL_IMAGES = [
  "https://i.pinimg.com/originals/f2/0d/04/f20d043becf2653a7a098f5d8b55ff26.gif",
  "/mdl/mar.webp",
  "https://i.pinimg.com/736x/ef/95/31/ef9531a17b83b5cac5a1194207c9225e.jpg",
  "/mdl/lov.webp",
  "https://i.pinimg.com/originals/c3/5b/fc/c35bfcfa2036d27751f9ea2bbf3a9e67.gif",
  "/mdl/nos.webp",
  "https://i.pinimg.com/originals/f2/5b/34/f25b34a40165fbe61cb5a7e57dae7b1c.gif",
  "https://prodigits.co.uk/pthumbs/screensavers/down/love-romance/romanticco_p5HyRmBT.gif",
  "https://i.pinimg.com/originals/09/c8/2d/09c82d1ca170b86387836e9b343e28a8.gif",
  "https://c.tenor.com/1BrL8EraleEAAAAd/tenor.gif",
  "https://c.tenor.com/DB7GrGaHGr8AAAAd/tenor.gif",
  "https://i.pinimg.com/originals/24/ec/75/24ec752df945dce5fe16726a57bc3111.gif",
  "https://i.pinimg.com/originals/9d/49/f2/9d49f2c9ac86a26d6e1b36ac99a3d43b.gif",
  "https://img1.picmix.com/output/pic/normal/9/3/0/0/6650039_fd6aa.gif",
  "https://i.pinimg.com/originals/49/61/86/49618609a15bbc0ccdce4833193715df.gif",
  "https://i.pinimg.com/originals/e7/1b/94/e71b94825552cd74fcf145a6ea933002.gif",
  "/mdl/casal.webp",
  "/image/eu.jpg",
  "/mdl/red.webp"
];

// Cálculo de ângulo pré-computado
const ANGLE_STEP = 360 / CAROUSEL_IMAGES.length;

function ThreeDCarousel() {
  return (
    <div
      className="w-full h-full max-h-[1600px] fixed inset-0 bg-cover bg-center bg-no-repeat overflow-hidden mt-[5px] flex flex-col items-center justify-center select-none"
      style={{ backgroundImage: "url('/image/bg1.gif')" }}
    >
      <h1 className="text-red-600 font-impact text-7xl mb-12 drop-shadow-[0_0_20px_red] mt-[-96px]">
        MADRUGADA LOVE
      </h1>

      <div className="mt-20">
        <img
          src="/cor.gif"
          alt="Coração Alado"
          className="w-[400px]"
          decoding="async"
        />
      </div>

      <div className="w-[300px] h-[300px] relative [perspective:1500px]">
        <div className="w-full h-full absolute preserve-3d animate-rotar-3d transform-gpu will-change-transform">
          {CAROUSEL_IMAGES.map((src, idx) => (
            <div
              key={idx}
              className="w-[180px] h-[200px] absolute shadow-[0_0_20px_#000] transform-gpu"
              style={{
                transform: `rotateY(${idx * ANGLE_STEP}deg) translateZ(750px)`
              }}
            >
              <img
                src={src}
                alt="Slide"
                className="w-full h-full object-cover rounded pointer-events-none"
                decoding="async"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default memo(ThreeDCarousel);