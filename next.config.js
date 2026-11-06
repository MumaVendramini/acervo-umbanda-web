/** @type {import('next').NextConfig} */
const agora = new Date();
const partes = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hour12: false
}).formatToParts(agora);
const getP = (type) => partes.find(p => p.type === type)?.value || '';
const buildTimestamp = `${getP('year')}${getP('month')}${getP('day')}${getP('hour')}${getP('minute')}`;

const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_APP_VERSION: buildTimestamp,
  },
};

module.exports = nextConfig;

