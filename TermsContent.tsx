import { TERMS_INTRODUCTION, TERMS_SECTIONS } from '@/lib/terms';

interface TermsContentProps {
  headingLevel?: 2 | 3;
  idPrefix?: string;
}

export function TermsContent({ headingLevel = 2, idPrefix = '' }: TermsContentProps) {
  const Heading = headingLevel === 3 ? 'h3' : 'h2';

  return (
    <article className="space-y-8 break-words text-sm leading-7 text-zinc-300 sm:text-[15px]">
      <p>{TERMS_INTRODUCTION}</p>
      {TERMS_SECTIONS.map((section) => (
        <section
          key={section.id}
          id={`${idPrefix}${section.id}`}
          aria-labelledby={`${idPrefix}${section.id}-title`}
          className={section.highlighted
            ? 'scroll-mt-6 rounded-2xl border border-amber-400/50 bg-amber-400/5 p-4 sm:p-5'
            : 'scroll-mt-6 border-t border-white/10 pt-6'}
        >
          <Heading
            id={`${idPrefix}${section.id}-title`}
            className={`mb-4 text-base font-bold leading-6 sm:text-lg ${section.highlighted ? 'text-amber-300' : 'text-white'}`}
          >
            {section.title}
          </Heading>
          <div className="space-y-4">
            {section.blocks.map((block, index) => {
              if (block.type === 'list') {
                return (
                  <ul key={index} className="list-disc space-y-3 pl-5 marker:text-amber-400">
                    {block.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="pl-1">
                        {item.label && <><strong className="font-semibold text-zinc-100">{item.label}</strong>{' '}</>}
                        {item.text}
                      </li>
                    ))}
                  </ul>
                );
              }
              if (block.type === 'notice') {
                return (
                  <div key={index} role="note" className="space-y-3 text-amber-100">
                    <p className="font-extrabold">{block.title}</p>
                    <p className="font-semibold">{block.text}</p>
                  </div>
                );
              }
              return (
                <p key={index} className={block.emphasis ? 'rounded-xl border border-amber-400/25 bg-amber-400/5 p-4 font-semibold text-amber-100' : undefined}>
                  {block.text}
                </p>
              );
            })}
          </div>
        </section>
      ))}
    </article>
  );
}
