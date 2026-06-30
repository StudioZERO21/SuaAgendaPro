import { cn } from "@/lib/utils";

type LazyImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  /** Avatar/logo acima da dobra — carrega imediatamente. */
  priority?: boolean;
};

/**
 * Imagem otimizada: lazy por padrão, decoding async e dimensões explícitas quando informadas.
 */
export function LazyImage({
  className,
  priority = false,
  loading,
  decoding = "async",
  alt = "",
  ...props
}: LazyImageProps) {
  return (
    <img
      alt={alt}
      loading={loading ?? (priority ? "eager" : "lazy")}
      decoding={decoding}
      fetchPriority={priority ? "high" : undefined}
      className={cn(className)}
      {...props}
    />
  );
}
