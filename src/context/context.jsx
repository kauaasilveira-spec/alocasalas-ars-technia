import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [telaAtual, setTelaAtual] = useState('Inicio'); // 'Inicio' | 'DetalhesdoLocal' | 'Reservas' | etc.
  const [solicitacaoAtual, setSolicitacaoAtual] = useState({
    id: '1',
    professor: 'Prof. Marcos / Caique',
    qtdAlunos: 33,
    local: 'LAB INFO 204 (Bloco B)',
    turma: 'Técnico em Informática - Módulo II',
    status: 'Pendente',
  });

  const navegarPara = (nomeTela, dadosExtra = null) => {
    if (dadosExtra) {
      setSolicitacaoAtual(dadosExtra);
    }
    setTelaAtual(nomeTela);
  };

  const atualizarStatusSolicitacao = (novoStatus) => {
    setSolicitacaoAtual((prev) => ({ ...prev, status: novoStatus }));
    alert(`Solicitação marcada como: ${novoStatus}`);
  };

  return (
    <AppContext.Provider
      value={{
        telaAtual,
        navegarPara,
        solicitacaoAtual,
        atualizarStatusSolicitacao,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);