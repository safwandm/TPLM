import { FaTrash } from "react-icons/fa";

export default function QuestionCard({ question, index, onEdit, onDelete }) {
  return (
    <div className="relative bg-white rounded-2xl shadow border p-6 space-y-4">
      <button onClick={() => onDelete(question.id)} className="absolute top-4 right-4 text-red-500">
        <FaTrash />
      </button>

      <div className="font-semibold text-lg">
        {index + 1}. {question.text}
      </div>

      {question.image && <img src={question.image} className="rounded-xl border" />}

      {question.math && (
        <div className="bg-gray-100 rounded-lg px-4 py-2 font-mono">
          {question.math}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {Object.entries(question.options).map(([k, v]) => (
          <div key={k} className={`border rounded px-3 py-2 ${k === question.correct ? "bg-green-100" : "bg-gray-50"}`}>
            {v}
          </div>
        ))}
      </div>

      <div className="text-sm text-gray-500">
        Timer: {question.timer ?? "-"}
      </div>

      {onEdit && (
        <button onClick={() => onEdit(question)} className="text-blue-600 text-sm">
          Edit
        </button>
      )}
    </div>
  );
}
