import React from 'react';
import { Link } from 'react-router-dom';

function TopCard({ item, index }) {
   const destination = () => {
    switch (item.title) {
        case "Models":
            return "/models";
        case "Chat":
            return "/chat";
        case "Workflows":
            return "/workflows";
        case "Workspace Security":
            return "/workspace-security";
        case "IDE":
            return "/ide";
        default:
            return "/";
    }
   }
    return (
        <Link to={destination()}>
            <div
                key={`top-card-${index}`}
                // Largura aumentada para w-72 (288px) - aumento moderado
                className="w-72 h-96 border-2 border-white/20 bg-black rounded-3xl px-10 py-8 shadow-2xl flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer"
                >
                    <div className="w-full h-auto mb-4">
                    {/* Título: Branco - ajustado proporcionalmente */}
                        <h3 className="text-2xl font-bold text-white overflow-hidden whitespace-nowrap text-ellipsis leading-tight font-playfair">{item.title}</h3>
                    <div className="w-3/5 h-4 bg-white/10 rounded-full mt-2"></div>
                </div>

                {/* Conteúdo Principal do Cartão: Usa a cor secundária #605C4E - padding ajustado proporcionalmente */}
                <div className="flex-grow bg-[#605C4E]/90 rounded-2xl mb-4 p-5 space-y-2 flex flex-col justify-center">
                    <p className="text-white text-sm font-semibold leading-relaxed">{item.detail.split('.')[0]}.</p>
                    <p className="text-white/90 text-xs leading-relaxed mt-1">{item.detail.split('.')[1] ? item.detail.split('.')[1].trim() : ""}</p>
                    <p className="text-white/95 text-xs font-medium mt-auto border-t border-white/20 pt-1 leading-relaxed">{item.indicator}</p>
                </div>

                {/* Placeholder para um indicador/botão no rodapé */}
                <div className="w-full h-4 bg-white/20 rounded-full"></div>
            </div>
        </Link>
    );
    }

export default TopCard;
