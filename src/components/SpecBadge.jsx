import { getSpecialty } from '../data/constants';
import { Badge } from './ui/Badge';

export function SpecBadge({ type, small }) {
  const cfg = getSpecialty(type);
  return (
    <Badge color={cfg.color} bg={cfg.muted} className={small ? 'text-[10px] !px-2' : ''}>
      {cfg.label}
    </Badge>
  );
}
