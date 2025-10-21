import React, { useState, useEffect } from 'react';

// Constantes organizadas
const STYLES = {
  // Estilo base do botão, com foco na acessibilidade e transições suaves.
  base: "flex items-center justify-center w-10 h-10 bg-transparent border border-[#605C4E] rounded-lg cursor-pointer transition-all duration-300 relative hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#605C4E] p-2",
  icon: {
    // Estilo base para os ícones: posicionamento absoluto e transição.
    base: "absolute transition-all duration-500 flex items-center justify-center text-2xl w-full h-full",
    // Classe de visibilidade
    visible: "opacity-100 rotate-0 scale-100",
    hidden: "opacity-0 -rotate-90 scale-50"
  }
};

/**
 * Função utilitária para determinar o tema inicial com base na ordem de prioridade:
 * 1. localStorage (escolha do usuário)
 * 2. matchMedia (preferência do sistema)
 * 3. 'light' (padrão de fallback)
 *
 * É executada apenas uma vez pelo useState para definir o estado inicial correto.
 */
const getInitialTheme = () => {
    // Verifica se estamos no lado do cliente (navegador)
    if (typeof window === 'undefined') {
        return 'light';
    }

    try {
        const storedTheme = window.localStorage.getItem('data-theme');
        if (storedTheme === 'dark' || storedTheme === 'light') {
            // Prioridade 1: Tema salvo no localStorage
            document.documentElement.setAttribute('data-theme', storedTheme);
            return storedTheme;
        }

        // Prioridade 2: Preferência do sistema
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialTheme = prefersDark ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', initialTheme);
        return initialTheme;

    } catch (error) {
        // Fallback robusto se o localStorage falhar
        console.error("Erro ao determinar o tema inicial, usando 'light'.", error);
        return 'light';
    }
};


/**
 * Componente ButtonTheme que gerencia e persiste o estado do tema (light/dark).
 * O tema inicial é lido de forma síncrona usando a função getInitialTheme.
 */
export default function ButtonTheme({ className = '' }) {
    // Inicializa o estado com a função de inicialização preguiçosa.
    const [theme, setTheme] = useState(getInitialTheme);

    /**
     * Efeito: Persistência do Tema após Alteração pelo Usuário
     * Executado toda vez que o estado 'theme' muda.
     * 1. Atualiza o atributo 'data-theme' no <html>.
     * 2. Persiste a escolha do usuário no localStorage.
     */
    useEffect(() => {
        // Esta verificação é redundante após getInitialTheme, mas adiciona robustez extra.
        if (typeof window !== 'undefined' && (theme === 'dark' || theme === 'light')) {
             try {
                // Aplica ao DOM (necessário para o caso de o tema mudar após o clique do usuário)
                document.documentElement.setAttribute('data-theme', theme);
                // Salva a preferência do usuário
                window.localStorage.setItem('data-theme', theme);
            } catch (error) {
                console.error("Não foi possível salvar a preferência de tema.", error);
            }
        }
    }, [theme]);

    /**
     * Manipulador de Evento: Alterna entre 'light' e 'dark'
     */
    const handleToggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
    };

    const isDark = theme === 'dark';

    return (
        <button
            onClick={handleToggleTheme}
            // Melhora a acessibilidade: o label descreve a ação atual (mudar para o outro tema)
            aria-label={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
            title={isDark ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
            className={`${STYLES.base} ${className}`}
        >
            {/* Ícone Sol: Visível no Modo Escuro */}
            <span
                className={`${STYLES.icon.base} ${
                    isDark ? STYLES.icon.visible : STYLES.icon.hidden
                }`}
            >
                ☀️
            </span>

            {/* Ícone Lua: Visível no Modo Claro */}
            <span
                className={`${STYLES.icon.base} ${
                    isDark ? STYLES.icon.hidden : STYLES.icon.visible
                }`}
            >
                🌙
            </span>
        </button>
    );
}