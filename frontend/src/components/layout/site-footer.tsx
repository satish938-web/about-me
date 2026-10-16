export function SiteFooter({ name }: { name: string }) {
  return (
    <footer>
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 pt-8 pb-24 text-sm text-ink/70 md:flex-row md:items-center md:justify-between md:px-8">
        <p>{name}</p>
        <p>Sample content. Edit the content folder to make this yours.</p>
      </div>
    </footer>
  );
}
