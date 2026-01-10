import React from 'react';

const Footer = () => {
  return (
    <footer className="w-full border-t border-surface-border py-8 mt-auto bg-[#0f1416]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-slate-500 text-[20px]">hub</span>
          <span className="text-lg font-bold text-white">Sageo</span>
          <span className="text-sm text-slate-500 ml-2">2026</span>
        </div>
        <div className="flex gap-6 text-sm text-slate-500">
          {/* <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a> */}
          <span className="transition-colors">Made by <a href="https://www.boilerblockchain.org/" target="_blank" rel="noopener noreferrer" className="hover:text-primary">Boiler Blockchain</a>, in collaboration with the <a href="https://moi.technology/" target="_blank" rel="noopener noreferrer" className="hover:text-primary">Moi Protocol</a>.</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;