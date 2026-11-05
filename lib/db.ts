import fs from 'fs';
import path from 'path';

export interface Ponto {
  id: string;
  linha: string;
  titulo?: string;
  toque?: string;
  letra: string;
  origem?: string;
  video_url?: string;
  autor?: string;
  criado_em?: string;
}

export interface PontoPendente extends Ponto {
  nome_usuario: string;
  data_envio: string;
  status: 'pendente' | 'aprovado' | 'rejeitado';
}

export interface Comentario {
  id: string;
  ponto_id: string;
  primeiro_verso: string;
  nome_usuario: string;
  mensagem: string;
  data_envio: string;
  status: 'pendente' | 'resolvido';
}

const DATA_DIR = path.join(process.cwd(), 'data');

export function getPontos(): Ponto[] {
  const filePath = path.join(DATA_DIR, 'pontos.json');
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const raw = JSON.parse(content);
  return raw.map((p: any, idx: number) => ({
    id: p.id || `pt-${idx + 1}`,
    linha: p.linha || 'Diversos',
    titulo: p.titulo || '',
    toque: p.toque || '',
    letra: p.letra || '',
    origem: p.origem || '',
    video_url: p.video_url || '',
    autor: p.autor || ''
  }));
}

export function savePontos(pontos: Ponto[]) {
  const filePath = path.join(DATA_DIR, 'pontos.json');
  fs.writeFileSync(filePath, JSON.stringify(pontos, null, 2), 'utf-8');
}

export function getPendentes(): PontoPendente[] {
  const filePath = path.join(DATA_DIR, 'pendentes.json');
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

export function savePendentes(pendentes: PontoPendente[]) {
  const filePath = path.join(DATA_DIR, 'pendentes.json');
  fs.writeFileSync(filePath, JSON.stringify(pendentes, null, 2), 'utf-8');
}

export function getComentarios(): Comentario[] {
  const filePath = path.join(DATA_DIR, 'comentarios.json');
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

export function saveComentarios(comentarios: Comentario[]) {
  const filePath = path.join(DATA_DIR, 'comentarios.json');
  fs.writeFileSync(filePath, JSON.stringify(comentarios, null, 2), 'utf-8');
}

