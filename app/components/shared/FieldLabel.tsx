interface FieldLabelProps {
    title: string;
    htmlFor?: string;
    required?: boolean;
}

export default function FieldLabel({ 
    title,
    htmlFor,
    required = true
 }: FieldLabelProps)
{
    return <label htmlFor={htmlFor} className="mb-2 block text-sm font-medium text-gray-700">
            { title } 
            { required && (
            <span className="text-red-500 ml-1" aria-hidden="true">*</span>
            )}
           </label>
}