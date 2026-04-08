import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Phone, Linkedin, Star, Briefcase } from 'lucide-react';
import type { PublicAgent } from '@/shared/utils/public-vitrine-api';

interface AgentCardProps {
  agent: PublicAgent;
  primaryColor?: string;
  whatsappNumber?: string;
}

export const AgentCard: React.FC<AgentCardProps> = ({ agent, primaryColor, whatsappNumber }) => {
  const router = useRouter();
  const { slug } = router.query as { slug: string };
  const base = slug ? `/sites/${slug}` : '';
  const href = `${base}/agents/${agent.id}`;
  const wp = agent.whatsapp
    ? `https://wa.me/${agent.whatsapp.replace(/\D/g, '')}?text=Bonjour ${agent.displayName}`
    : null;

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 flex flex-col">
      {/* Photo */}
      <div className="relative bg-gray-50 flex items-center justify-center" style={{ height: 200 }}>
        {agent.photo ? (
          <Image src={agent.photo} alt={agent.displayName} fill style={{ objectFit: 'cover' }} />
        ) : (
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl"
            style={{ backgroundColor: primaryColor || 'var(--agency-primary)' }}
          >
            {agent.displayName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-bold text-gray-900 text-lg">{agent.displayName}</h3>
        {agent.role && (
          <p className="text-sm mt-0.5" style={{ color: primaryColor || 'var(--agency-primary)' }}>
            {agent.role}
          </p>
        )}
        {agent.speciality && (
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
            <Briefcase className="w-3.5 h-3.5" /> {agent.speciality}
          </p>
        )}
        {agent.bio && <p className="text-sm text-gray-600 mt-2 line-clamp-3">{agent.bio}</p>}

        {/* Stats */}
        {agent.stats && (
          <div className="flex gap-4 mt-3 pt-3 border-t border-gray-50 text-center">
            {agent.stats.totalSales != null && (
              <div>
                <p
                  className="font-bold text-lg"
                  style={{ color: primaryColor || 'var(--agency-primary)' }}
                >
                  {agent.stats.totalSales}
                </p>
                <p className="text-xs text-gray-500">Ventes</p>
              </div>
            )}
            {agent.stats.activeListings != null && (
              <div>
                <p
                  className="font-bold text-lg"
                  style={{ color: primaryColor || 'var(--agency-primary)' }}
                >
                  {agent.stats.activeListings}
                </p>
                <p className="text-xs text-gray-500">Biens actifs</p>
              </div>
            )}
            {agent.stats.yearsExp != null && (
              <div>
                <p
                  className="font-bold text-lg"
                  style={{ color: primaryColor || 'var(--agency-primary)' }}
                >
                  {agent.stats.yearsExp}
                </p>
                <p className="text-xs text-gray-500">Années exp.</p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          {agent.phone && (
            <a
              href={`tel:${agent.phone}`}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-white text-sm font-medium"
              style={{ backgroundColor: primaryColor || 'var(--agency-primary)' }}
            >
              <Phone className="w-3.5 h-3.5" /> Appeler
            </a>
          )}
          {wp && (
            <a
              href={wp}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-white text-sm font-medium"
              style={{ backgroundColor: '#25D366' }}
            >
              WA
            </a>
          )}
          {agent.linkedin && (
            <a
              href={agent.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              <Linkedin className="w-4 h-4" />
            </a>
          )}
        </div>

        <Link
          href={href}
          className="mt-2 text-center text-sm font-medium hover:underline"
          style={{ color: primaryColor || 'var(--agency-primary)' }}
        >
          Voir le profil →
        </Link>
      </div>
    </div>
  );
};

export default AgentCard;
