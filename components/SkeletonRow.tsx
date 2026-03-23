export default function SkeletonRow({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-3.5">
              <div
                className="h-4 rounded-lg bg-gray-100"
                style={{ width: j === 0 ? '2rem' : j === 1 ? '70%' : j === cols - 1 ? '4rem' : '60%' }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
