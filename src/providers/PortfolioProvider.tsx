'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';

interface PortfolioContextType {
  activePortfolio: string | null;
  setActivePortfolio: (id: string | null) => void;
  isLoading: boolean;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(
  undefined
);

export const PortfolioProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [activePortfolio, setPortfolioState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = Cookies.get('alpha_active_portfolio');
    if (saved) setPortfolioState(saved);
    setIsLoading(false);
  }, []);

  const setActivePortfolio = (id: string | null) => {
    setPortfolioState(id);
    if (id) {
      Cookies.set('alpha_active_portfolio', id, { expires: 365 });
    } else {
      Cookies.remove('alpha_active_portfolio');
    }
  };

  return (
    <PortfolioContext.Provider
      value={{ activePortfolio, setActivePortfolio, isLoading }}
    >
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
};
