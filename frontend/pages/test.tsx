export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-green-600 mb-4">✅ JSX Fonctionne !</h1>
        <p className="text-gray-600">Si vous voyez cette page, le runtime JSX est opérationnel.</p>
        <div className="mt-4 p-4 bg-blue-50 rounded">
          <p className="text-sm text-blue-800">
            <strong>Next.js</strong> : OK
            <br />
            <strong>React</strong> : OK
            <br />
            <strong>Tailwind CSS</strong> : OK
          </p>
        </div>
      </div>
    </div>
  );
}
