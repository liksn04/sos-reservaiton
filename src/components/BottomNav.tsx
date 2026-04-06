export type Tab = 'home' | 'reserve' | 'profile' | 'my-schedule';

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-2 bg-surface max-w-2xl mx-auto right-0 border-t border-white/5">
      <button
        onClick={() => onTabChange('home')}
        className={`flex flex-col items-center justify-center transition-all p-2 rounded-xl ${
          activeTab === 'home' 
            ? 'text-primary' 
            : 'text-gray-500 hover:text-white'
        }`}
      >
        <span className="material-symbols-outlined font-bold" style={activeTab === 'home' ? { fontVariationSettings: "'FILL' 1" } : {}}>home</span>
        <span className="text-[10px] font-bold mt-1">홈</span>
      </button>

      <button 
        onClick={() => onTabChange('reserve')}
        className={`flex flex-col items-center justify-center transition-all p-2 rounded-xl ${
          activeTab === 'reserve' 
            ? 'text-primary' 
            : 'text-gray-500 hover:text-white'
        }`}
      >
        <span className="material-symbols-outlined font-bold" style={activeTab === 'reserve' ? { fontVariationSettings: "'FILL' 1" } : {}}>add_box</span>
        <span className="text-[10px] font-bold mt-1">예약하기</span>
      </button>

      <button
        onClick={() => onTabChange('profile')}
        className={`flex flex-col items-center justify-center transition-all p-2 rounded-xl ${
          activeTab === 'profile' 
            ? 'text-primary' 
            : 'text-gray-500 hover:text-white'
        }`}
      >
        <span className="material-symbols-outlined font-bold" style={activeTab === 'profile' ? { fontVariationSettings: "'FILL' 1" } : {}}>person</span>
        <span className="text-[10px] font-bold mt-1">프로필</span>
      </button>
    </nav>
  );
}
