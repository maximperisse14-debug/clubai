export default function InsightBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-muted/50 border-l-2 border-purple-500 rounded-r-md px-3.5 py-2.5 text-sm text-muted-foreground leading-relaxed [&_strong]:text-foreground">
      {typeof children === 'string' ? (
        <p dangerouslySetInnerHTML={{ __html: children }} />
      ) : (
        children
      )}
    </div>
  )
}
