// Shared question form fields — used by CreateQuestionPage & EditQuestionPage

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash } from 'lucide-react';
import { C } from '@/constants/tutorTokens';

export function QuestionFormFields({ formData, setFormData, topics, skills }) {
    const handleTypeChange = (val) => {
        if (val === 'true_false') {
            const previousCorrect = formData.options?.find((option) => option.isCorrect)?.text?.toLowerCase();
            setFormData({
                ...formData,
                type: val,
                options: [
                    { text: 'True', isCorrect: previousCorrect === 'true' },
                    { text: 'False', isCorrect: previousCorrect === 'false' },
                ],
            });
            return;
        }

        if (val === 'mcq') {
            const existingOptions = Array.isArray(formData.options) ? formData.options : [];
            const normalized = existingOptions.length >= 2
                ? existingOptions
                : [{ text: '', isCorrect: false }, { text: '', isCorrect: false }];
            setFormData({ ...formData, type: val, options: normalized });
            return;
        }

        setFormData({ ...formData, type: val, options: [] });
    };

    const isObjective = formData.type === 'mcq' || formData.type === 'true_false';

    const setCorrectAnswer = (index) => {
        setFormData({ ...formData, options: formData.options.map((o, i) => ({ ...o, isCorrect: i === index })) });
    };

    const handleOptionChange = (index, value) => {
        const newOptions = [...formData.options];
        newOptions[index].text = value;
        setFormData({ ...formData, options: newOptions });
    };

    const addOption = () => {
        setFormData({ ...formData, options: [...formData.options, { text: '', isCorrect: false }] });
    };

    const removeOption = (index) => {
        if (formData.options.length <= 2) return;
        setFormData({ ...formData, options: formData.options.filter((_, i) => i !== index) });
    };

    return (
        <>
            {/* Type + Difficulty */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">Question Type</Label>
                    <Select value={formData.type} onValueChange={handleTypeChange}>
                        <SelectTrigger className="h-10 border-slate-200"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="mcq">Multiple Choice (MCQ)</SelectItem>
                            <SelectItem value="true_false">True / False</SelectItem>
                            <SelectItem value="fill_blank">Fill In The Blank</SelectItem>
                            <SelectItem value="subjective">Subjective / Open-Ended</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">Difficulty</Label>
                    <Select value={formData.difficulty} onValueChange={(val) => setFormData({ ...formData, difficulty: val })}>
                        <SelectTrigger className="h-10 border-slate-200"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Question Text */}
            <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">
                    Question Text <span className="text-red-500">*</span>
                </Label>
                <Input
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    placeholder="Enter your question here..."
                    className="h-10 border-slate-200"
                />
            </div>

            {/* MCQ Options / Subjective Answer */}
            {isObjective ? (
                <div className="space-y-3">
                    <div>
                        <Label className="text-sm font-semibold text-slate-700">
                            {formData.type === 'true_false' ? 'Answer Options' : 'Options'} <span className="text-red-500">*</span>
                        </Label>
                        <p className="text-xs text-slate-400 mt-0.5">Select the radio button next to the correct answer.</p>
                    </div>
                    {formData.options.map((option, index) => (
                        <div key={index} className="flex items-center gap-3">
                            <input
                                type="radio"
                                name="correctOption"
                                checked={option.isCorrect}
                                onChange={() => setCorrectAnswer(index)}
                                className="w-4 h-4 flex-shrink-0"
                                style={{ accentColor: C.btnPrimary }}
                            />
                            <Input
                                value={option.text}
                                onChange={(e) => handleOptionChange(index, e.target.value)}
                                placeholder={formData.type === 'true_false' ? '' : `Option ${String.fromCharCode(65 + index)}`}
                                disabled={formData.type === 'true_false'}
                                className={`h-9 text-sm ${option.isCorrect
                                    ? 'border-emerald-400 ring-1 ring-emerald-100 bg-emerald-50/50'
                                    : 'border-slate-200'}`}
                            />
                            {formData.type === 'mcq' && formData.options.length > 2 && (
                                <button
                                    type="button"
                                    onClick={() => removeOption(index)}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors flex-shrink-0">
                                    <Trash className="w-3.5 h-3.5 text-red-400" />
                                </button>
                            )}
                        </div>
                    ))}
                    {formData.type === 'mcq' && (
                        <Button type="button" variant="outline" size="sm" onClick={addOption} className="gap-1.5 border-dashed text-sm">
                            <Plus className="w-3.5 h-3.5" /> Add Option
                        </Button>
                    )}
                </div>
            ) : (
                <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">
                        {formData.type === 'fill_blank' ? 'Correct Answer' : 'Ideal Answer / Grading Rubric'} <span className="text-red-500">*</span>
                    </Label>
                    <textarea
                        className="w-full min-h-[110px] p-3 text-sm rounded-xl border border-slate-200 outline-none resize-y text-slate-700 focus:border-[#7573E8] focus:ring-2 focus:ring-[#7573E8]/10 transition-colors"
                        value={formData.idealAnswer}
                        onChange={(e) => setFormData({ ...formData, idealAnswer: e.target.value })}
                        placeholder="Enter the expected answer or grading rubric..."
                    />
                    <p className="text-xs text-slate-400">Not shown to students. For manual grading reference only.</p>
                </div>
            )}

            {/* Metadata Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">Topic</Label>
                    <Select value={formData.topicId} onValueChange={(val) => setFormData({ ...formData, topicId: val })}>
                        <SelectTrigger className="h-10 border-slate-200"><SelectValue placeholder="Select Topic" /></SelectTrigger>
                        <SelectContent>
                            {topics.map(t => <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">Skill</Label>
                    <Select value={formData.skillId} onValueChange={(val) => setFormData({ ...formData, skillId: val })}>
                        <SelectTrigger className="h-10 border-slate-200"><SelectValue placeholder="Select Skill" /></SelectTrigger>
                        <SelectContent>
                            {skills.map(s => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">Points</Label>
                    <Input
                        type="number"
                        value={formData.points}
                        onChange={(e) => setFormData({ ...formData, points: e.target.value === '' ? '' : Number(e.target.value) })}
                        min={1}
                        className="h-10 border-slate-200"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">Explanation (Optional)</Label>
                    <Input
                        value={formData.explanation}
                        onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                        placeholder="Explain the correct answer..."
                        className="h-10 border-slate-200"
                    />
                </div>
            </div>
        </>
    );
}
