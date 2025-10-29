'use client';

import { cn } from '@/lib/utils';
import {
  BookOpenText,
  Home,
  Search,
  Settings,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import { useSelectedLayoutSegments } from 'next/navigation';
import React, { useState, type ReactNode } from 'react';
import Layout from './Layout';
import SettingsButton from './Settings/SettingsButton';

const VerticalIconContainer = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return <div className={cn('flex flex-col items-center w-full', className)}>{children}</div>;
};

const Sidebar = ({ children }: { children: React.ReactNode }) => {
  const segments = useSelectedLayoutSegments();
  const [isOpen, setIsOpen] = useState<boolean>(true);

  const navLinks = [
    {
      icon: Home,
      href: '/',
      active: segments.length === 0 || segments.includes('c'),
      label: 'Início',
    },
    {
      icon: Search,
      href: '/discover',
      active: segments.includes('discover'),
      label: 'Explorar',
    },
    {
      icon: BookOpenText,
      href: '/library',
      active: segments.includes('library'),
      label: 'Conversas',
    },
  ];

  return (
    <div>
      {/* Sidebar desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-20 lg:flex-col border-r border-light-200/50 dark:border-dark-200/50 backdrop-blur-sm">
        <div className="flex grow flex-col items-center justify-start gap-y-6 overflow-y-auto bg-gradient-to-b from-light-secondary via-light-secondary to-light-secondary/95 dark:from-dark-secondary dark:via-dark-secondary dark:to-dark-secondary/95 px-3 py-8">
          
          {/* Botão de adicionar com efeito gradiente */}
          <a
            href="/"
            className="group relative p-3 rounded-2xl bg-gradient-to-br from-light-200 to-light-200/80 dark:from-dark-200 dark:to-dark-200/80 hover:shadow-lg hover:shadow-light-200/20 dark:hover:shadow-black/40 hover:scale-110 active:scale-95 transition-all duration-300 ease-out"
          >
            <Plus 
              size={20} 
              className="text-black/70 dark:text-white/70 group-hover:rotate-90 transition-transform duration-300" 
            />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-transparent to-black/5 dark:to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </a>

          {/* Separador sutil */}
          <div className="w-8 h-px bg-gradient-to-r from-transparent via-light-200 to-transparent dark:via-dark-200" />

          {/* Ícones de navegação */}
          <VerticalIconContainer className="space-y-3">
            {navLinks.map((link, i) => (
              <Link
                key={i}
                href={link.href}
                className={cn(
                  'group relative flex flex-col items-center justify-center gap-1.5 cursor-pointer w-full transition-all duration-300',
                )}
              >
                <div
                  className={cn(
                    'relative p-3 rounded-2xl transition-all duration-300 ease-out',
                    link.active
                      ? 'bg-light-200 dark:bg-dark-200 shadow-md shadow-light-200/30 dark:shadow-black/50 scale-105'
                      : 'hover:bg-light-200/60 dark:hover:bg-dark-200/60 hover:scale-105 active:scale-95',
                  )}
                >
                  <link.icon
                    size={22}
                    className={cn(
                      'transition-all duration-300',
                      link.active
                        ? 'text-black/80 dark:text-white/80'
                        : 'text-black/50 dark:text-white/50 group-hover:text-black/70 dark:group-hover:text-white/70',
                    )}
                    strokeWidth={link.active ? 2.5 : 2}
                  />
                  
                  {/* Indicador de ativo */}
                  {link.active && (
                    <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-black/60 via-black/80 to-black/60 dark:from-white/60 dark:via-white/80 dark:to-white/60 rounded-r-full" />
                  )}
                </div>
                
                <p
                  className={cn(
                    'text-[9px] font-medium tracking-wide transition-all duration-300',
                    link.active
                      ? 'text-black/90 dark:text-white/90 scale-105'
                      : 'text-black/50 dark:text-white/50 group-hover:text-black/70 dark:group-hover:text-white/70',
                  )}
                >
                  {link.label}
                </p>
              </Link>
            ))}
          </VerticalIconContainer>

          {/* Separador sutil */}
          <div className="mt-auto w-8 h-px bg-gradient-to-r from-transparent via-light-200 to-transparent dark:via-dark-200" />

          {/* Botão de configurações com efeito */}
          <div className="mb-2">
            <div className="group relative">
              <SettingsButton />
            </div>
          </div>
        </div>
      </div>

      {/* Barra inferior (mobile) - Modernizada */}
      <div className="fixed bottom-0 w-full z-50 flex flex-row items-center gap-x-2 bg-light-secondary/95 dark:bg-dark-secondary/95 backdrop-blur-lg px-6 py-3 shadow-2xl shadow-black/10 dark:shadow-black/50 border-t border-light-200/50 dark:border-dark-200/50 lg:hidden">
        {navLinks.map((link, i) => (
          <Link
            href={link.href}
            key={i}
            className={cn(
              'relative flex flex-col items-center justify-center gap-1.5 text-center w-full py-2 px-3 rounded-2xl transition-all duration-300',
              link.active
                ? 'bg-light-200/80 dark:bg-dark-200/80'
                : 'hover:bg-light-200/40 dark:hover:bg-dark-200/40 active:scale-95',
            )}
          >
            {/* Indicador superior para mobile */}
            {link.active && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-1 rounded-b-full bg-gradient-to-r from-black/40 via-black/80 to-black/40 dark:from-white/40 dark:via-white/80 dark:to-white/40" />
            )}
            
            <link.icon 
              size={22}
              className={cn(
                'transition-all duration-300',
                link.active
                  ? 'text-black/80 dark:text-white/80'
                  : 'text-black/50 dark:text-white/60',
              )}
              strokeWidth={link.active ? 2.5 : 2}
            />
            
            <p 
              className={cn(
                'text-[10px] font-medium transition-all duration-300',
                link.active
                  ? 'text-black/90 dark:text-white/90'
                  : 'text-black/60 dark:text-white/60',
              )}
            >
              {link.label}
            </p>
          </Link>
        ))}
      </div>

      {/* Conteúdo principal */}
      <Layout>{children}</Layout>
    </div>
  );
};

export default Sidebar;