import { uid, validateData, type Data, type Scope } from './domain.ts';
export interface Proposal { type: 'create_goal' | 'update_goal'; name: string; goalId: string; target: number; monthly: number; deadline: string }
export function applyProposal(data: Data, scope: Scope, action: Proposal): Data {
  if (!action || !['create_goal','update_goal'].includes(action.type) || typeof action.name !== 'string' || typeof action.deadline !== 'string') throw new Error('Proposta inválida.');
  const goal = {name:action.name.trim(),target:action.target,monthly:action.monthly,...(action.deadline ? {deadline:action.deadline} : {})};
  if (action.type === 'update_goal' && !data.goals.some(g => g.id === action.goalId && g.scope === scope)) throw new Error('Meta não encontrada neste espaço.');
  return validateData({...data,goals:action.type === 'create_goal' ? [...data.goals,{...goal,id:uid(),scope,saved:0}] : data.goals.map(g => g.id === action.goalId && g.scope === scope ? {...g,...goal,deadline:action.deadline || undefined} : g)});
}
