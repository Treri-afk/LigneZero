import { useCountUp } from '@/hooks/useCountUp';

type CounterProps = {
  value: number;
  /** Longueur minimale, pour afficher « 04 » plutôt que « 4 ». */
  padTo?: number;
  suffix?: string;
  className?: string;
  suffixClassName?: string;
};

/** Chiffre qui s'incrémente à l'apparition. */
export function Counter({ value, padTo, suffix, className, suffixClassName }: CounterProps) {
  const { ref, value: current } = useCountUp(value);
  const shown = padTo ? String(current).padStart(padTo, '0') : String(current);

  return (
    <b className={className} ref={ref}>
      {shown}
      {suffix ? <em className={suffixClassName}>{suffix}</em> : null}
    </b>
  );
}
