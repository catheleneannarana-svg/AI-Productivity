import React from 'react';
import { HelpCircle, ExternalLink, Keyboard, Video, ArrowUp, ArrowDown, Activity } from 'lucide-react';

export default function Instructions() {
  return (
    <div className="border-2 border-emerald-900/50 bg-neutral-950 rounded-2xl p-5 font-mono text-emerald-400 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-2 border-b border-emerald-950 pb-3 mb-4">
        <HelpCircle className="h-5 w-5 text-emerald-400" />
        <h2 className="text-xs font-black tracking-widest uppercase text-white">
          INSTRUCTION_STAGE_MANUAL.txt
        </h2>
      </div>

      <div className="space-y-5 text-[10px]">
        {/* Keyboard Instructions Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-white font-bold uppercase">
            <Keyboard className="h-4 w-4 text-emerald-450 shrink-0" />
            <span>Classic Keyboard Grid Controls</span>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-1">
            <div className="border border-emerald-950/60 p-2.5 text-center bg-black/40 rounded-lg">
              <div className="flex justify-center gap-1 mb-1.5">
                <span className="bg-emerald-950 text-[8px] border border-emerald-500/30 text-white px-2 py-0.5 rounded font-bold">SPACE</span>
                <span className="bg-emerald-950 text-[8px] border border-emerald-500/30 text-white px-1 py-0.5 rounded font-bold">▲</span>
              </div>
              <span className="font-bold text-white uppercase text-[9px]">JUMP OPERATION</span>
              <p className="text-[8px] text-zinc-500 mt-1 uppercase">Press once for high vault. Tap mid-air to double-jump!</p>
            </div>
            
            <div className="border border-emerald-950/60 p-2.5 text-center bg-black/40 rounded-lg">
              <div className="flex justify-center gap-1 mb-1.5">
                <span className="bg-emerald-950 text-[8px] border border-emerald-500/30 text-white px-2 py-0.5 rounded font-bold">▼ DOWN</span>
              </div>
              <span className="font-bold text-white uppercase text-[9px]">DUCK / SLIDE</span>
              <p className="text-[8px] text-zinc-500 mt-1 uppercase">Hold ArrowDown to duck under hurdles and force quick airborne fall.</p>
            </div>
          </div>
        </div>

        {/* Neural Interface Teachable Instructions Section */}
        <div className="space-y-2 pt-3 border-t border-emerald-950/60">
          <div className="flex items-center gap-1.5 text-white font-bold uppercase">
            <Video className="h-4 w-4 text-cyan-400 shrink-0" />
            <span>Teachable Machine Interface Tutorial</span>
          </div>
          <p className="text-zinc-400 font-sans leading-relaxed text-[10px]">
            Teachable Machine is a free, web-based tool by Google that makes creating custom machine learning models fast and easy for everyone.
          </p>

          <ol className="list-decimal list-inside space-y-2 text-[9.5px] leading-relaxed text-zinc-400 mt-2">
            <li>
              Log into{' '}
              <a
                href="https://teachablemachine.withgoogle.com/"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 font-bold inline-flex items-center gap-0.5 underline hover:text-emerald-300"
              >
                Teachable Machine <ExternalLink className="h-3 w-3 inline" />
              </a>{' '}
              and click <strong>Get Started</strong>. Choose <strong>Image Project</strong> or <strong>Pose Project</strong>.
            </li>
            <li>
              Train 3 discrete gesture classes using your camera feed:
              <ul className="list-disc list-inside ml-4 mt-1 space-y-0.5 text-[8.5px]">
                <li><strong className="text-zinc-300">Class 1 (e.g. "idle")</strong>: Sit normally.</li>
                <li><strong className="text-emerald-450">Class 2 (e.g. "jump")</strong>: Wave hand or tilt chest high.</li>
                <li><strong className="text-cyan-400">Class 3 (e.g. "duck")</strong>: Lean left/right or duck.</li>
              </ul>
            </li>
            <li>
              Initiate <strong>Train Model</strong>. Once completed, select <strong>Export Model</strong>.
            </li>
            <li>
              Locate the <strong>Tensorflow.js</strong> tab, execute <strong>Upload (shareable link)</strong>, copy link and paste it on our controller on the left!
            </li>
          </ol>
        </div>

        {/* Advanced gesture run details */}
        <div className="border border-emerald-950 bg-emerald-950/20 rounded-xl p-3 text-emerald-500 leading-normal">
          <div className="text-[9px] font-bold uppercase mb-1 flex items-center gap-1">
            <Activity className="h-3.5 w-3.5 text-emerald-400 shrink-0" /> PRO CHIP: SPRINT OVERDRIVE SPEEDUP
          </div>
          <p className="text-[8.5px] uppercase">
            Train a fourth pose with aggressive actions (e.g., fast head nodding) and map to <strong className="text-white">RUN</strong>. Hand-held gesture recognition speeds your avatar up to 1.35x for accelerated points metrics!
          </p>
        </div>
      </div>
    </div>
  );
}
