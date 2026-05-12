
import React from 'react';

interface GuGuModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

export const GuGuModal: React.FC<GuGuModalProps> = ({ onClose, onConfirm }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
    <div className="bg-white border border-white/50 rounded-[2rem] p-8 max-w-sm w-full shadow-2xl">
      <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 bg-fashion-accent/10 rounded-full flex items-center justify-center text-2xl">📸</div>
          <h3 className="text-xl font-bold text-gray-900">开启咕咕风模式</h3>
          <div className="text-sm text-gray-500 leading-relaxed space-y-2">
            <p>此模式专为<b>人台图</b>或<b>挂拍平铺图</b>设计。</p>
            <p>如果是<b>真人模特图</b>，请务必开启右上角的<span className="text-fashion-accent font-bold">智能人台处理</span>功能，否则效果可能不佳。</p>
          </div>
          <div className="flex gap-3 w-full pt-4">
            <button 
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold transition-colors"
            >
              取消
            </button>
            <button 
              onClick={onConfirm}
              className="flex-1 py-3 rounded-xl bg-fashion-accent text-white font-bold hover:bg-blue-600 shadow-lg shadow-blue-500/30 text-xs transition-all"
            >
              确认开启
            </button>
          </div>
      </div>
    </div>
  </div>
);

interface StableWarningModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

export const StableWarningModal: React.FC<StableWarningModalProps> = ({ onClose, onConfirm }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
        <div className="bg-white border border-white/50 rounded-[2rem] p-8 max-w-sm w-full shadow-2xl">
            <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center text-2xl">🛡️</div>
                <h3 className="text-xl font-bold text-gray-900">开启稳定模式 (PRO)</h3>
                <div className="text-sm text-gray-600 leading-relaxed space-y-3 text-left bg-gray-50 p-4 rounded-xl">
                    <p>此模式将启用 <b>AI 质检员</b>，自动检测并修复画面细节错误。</p>
                    <ul className="list-disc pl-4 text-xs text-gray-500 space-y-1">
                        <li>生成时间较长 (30-60秒)</li>
                        <li>消耗更多算力</li>
                    </ul>
                    <div className="border-t border-gray-200 pt-2 mt-2">
                        <p className="text-xs font-bold text-amber-600">💡 优化建议：</p>
                        <p className="text-[10px] text-gray-500">
                            如果稳定模式生成结果仍不及预期（如衣服结构改变），请尝试<span className="font-bold text-gray-700">取消「智能人台处理」</span>后重试。
                        </p>
                    </div>
                </div>
                <div className="flex gap-3 w-full pt-2">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold transition-colors"
                    >
                        取消
                    </button>
                    <button 
                        onClick={onConfirm}
                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold hover:shadow-lg hover:shadow-amber-500/30 text-xs transition-all"
                    >
                        确认开启
                    </button>
                </div>
            </div>
        </div>
    </div>
);
