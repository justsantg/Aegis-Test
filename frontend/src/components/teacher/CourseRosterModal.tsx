'use client';

import React, { useState, useEffect } from 'react';
import {
  api,
  Course,
  RegisteredStudentData,
} from '../../lib/api';
import {
  X,
  Users,
  UserPlus,
  Trash2,
  Loader2,
  ExternalLink,
  MessageCircle,
  GraduationCap,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  Search,
  AlertTriangle,
} from 'lucide-react';

interface CourseRosterModalProps {
  course: Course;
  onClose: () => void;
  onRosterChanged?: () => void;
}

export default function CourseRosterModal({
  course,
  onClose,
  onRosterChanged,
}: CourseRosterModalProps) {
  const [roster, setRoster] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<RegisteredStudentData[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [studentToUnenroll, setStudentToUnenroll] = useState<{ id: number; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const capacity = course.capacity || course.maxCapacity || 8;

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [rosterData, studentsData] = await Promise.all([
        api.getCourseRoster(course.id),
        api.getStudents(),
      ]);
      setRoster(rosterData);
      setAllStudents(studentsData);
    } catch (err: any) {
      setError(err.message || 'Error al cargar lista de estudiantes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [course.id]);

  // Students not currently enrolled
  const enrolledStudentIds = new Set(
    roster.map((r) => r.student?.id).filter(Boolean),
  );
  const availableStudents = allStudents.filter(
    (s) => !enrolledStudentIds.has(s.id),
  );

  const filteredAvailableStudents = availableStudents.filter((s) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      s.fullName?.toLowerCase().includes(term) ||
      s.email?.toLowerCase().includes(term) ||
      (s.studentCode && s.studentCode.toLowerCase().includes(term))
    );
  });

  const selectedStudent = allStudents.find((s) => String(s.id) === selectedStudentId);

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;

    setError(null);
    setSuccessMsg(null);

    const sId = Number(selectedStudentId);
    if (roster.length >= capacity) {
      setError(`El curso ha alcanzado su capacidad máxima (${capacity} alumnos).`);
      return;
    }

    try {
      setEnrolling(true);
      await api.enrollStudent(course.id, sId);
      const studentObj = allStudents.find((s) => s.id === sId);
      setSuccessMsg(
        `¡${studentObj?.fullName || 'Estudiante'} matriculado exitosamente en ${course.courseName}!`,
      );
      setSelectedStudentId('');
      setSearchTerm('');
      setIsDropdownOpen(false);
      await loadData();
      if (onRosterChanged) onRosterChanged();
    } catch (err: any) {
      setError(err.message || 'Error al matricular estudiante');
    } finally {
      setEnrolling(false);
    }
  };

  const handleConfirmUnenroll = async () => {
    if (!studentToUnenroll) return;
    setError(null);
    setSuccessMsg(null);

    try {
      setRemovingId(studentToUnenroll.id);
      await api.unenrollStudent(course.id, studentToUnenroll.id);
      setSuccessMsg(`Se retiró a "${studentToUnenroll.name}" del curso.`);
      setStudentToUnenroll(null);
      await loadData();
      if (onRosterChanged) onRosterChanged();
    } catch (err: any) {
      setError(err.message || 'Error al retirar estudiante');
    } finally {
      setRemovingId(null);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'ES';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-paper-card border border-rule rounded-card max-w-3xl w-full p-6 sm:p-7 shadow-2xl space-y-6 my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-rule">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-accent-soft text-accent text-xs font-bold rounded">
                {course.level?.name || 'Nivel Oficial'}
              </span>
              <span className="px-2 py-0.5 bg-paper-muted text-ink-muted text-[11px] font-medium rounded">
                {course.courseModality === 'REGULAR_GROUP'
                  ? 'Grupo Regular'
                  : course.courseModality === 'PERSONALIZED_1ON1'
                  ? 'Particular 1-a-1'
                  : 'Semipersonalizado'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-ink flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-accent" />
              <span>Lista de Alumnos y Matrícula</span>
            </h2>
            <p className="text-xs text-ink-muted">
              Curso: <strong className="text-ink">{course.courseName}</strong> · Capacidad:{' '}
              <strong className={roster.length >= capacity ? 'text-danger' : 'text-ink'}>
                {roster.length} / {capacity} matriculados
              </strong>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-ink-muted hover:text-ink hover:bg-paper-muted rounded-btn transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="p-3 bg-danger-soft border border-danger/20 rounded-btn text-xs text-danger font-medium flex items-center gap-2 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-success-soft border border-success/20 rounded-btn text-xs text-success font-medium flex items-center gap-2 animate-in fade-in duration-150">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Section 1: Enroll registered student (Searchable Autocomplete Field) */}
        <div className="p-4 bg-paper-muted/60 border border-rule rounded-card space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-ink">
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-accent" />
              <span>Matricular Alumno Registrado en este Curso</span>
            </div>
            <span className="text-[11px] font-normal text-ink-muted">
              {availableStudents.length} disponibles para matricular
            </span>
          </div>

          <form onSubmit={handleEnroll} className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
            <div className="relative flex-1">
              {selectedStudent ? (
                // Selected student badge / chip preview
                <div className="flex items-center justify-between px-3 py-2 bg-paper-card border border-accent rounded-btn text-xs animate-in fade-in duration-100">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-7 h-7 rounded-full bg-accent text-accent-ink font-bold flex items-center justify-center text-xs shrink-0">
                      {selectedStudent.firstName?.[0] || 'E'}
                      {selectedStudent.lastName?.[0] || 'S'}
                    </div>
                    <div className="truncate">
                      <span className="font-bold text-ink">{selectedStudent.fullName}</span>
                      <span className="text-ink-muted ml-2 text-[11px]">({selectedStudent.email})</span>
                      {selectedStudent.studentCode && (
                        <span className="ml-1.5 font-mono text-[10px] px-1.5 py-0.5 bg-paper-muted border border-rule rounded text-accent font-bold">
                          {selectedStudent.studentCode}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStudentId('');
                      setSearchTerm('');
                    }}
                    className="p-1 text-ink-muted hover:text-danger rounded-btn transition-colors cursor-pointer shrink-0 ml-2"
                    title="Cambiar selección de estudiante"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                // Searchable text input
                <div className="relative">
                  <Search className="w-4 h-4 text-ink-muted absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    disabled={loading || enrolling || roster.length >= capacity}
                    placeholder={
                      roster.length >= capacity
                        ? 'Capacidad máxima del curso alcanzada'
                        : availableStudents.length === 0
                        ? 'No hay más alumnos registrados disponibles'
                        : 'Escribe el nombre o correo del estudiante...'
                    }
                    className="w-full text-xs font-medium pl-9 pr-8 py-2.5 rounded-btn border border-rule bg-paper-card text-ink focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-50"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-2.5 text-ink-muted hover:text-ink cursor-pointer p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Dropdown Results Menu */}
                  {isDropdownOpen && !selectedStudent && availableStudents.length > 0 && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsDropdownOpen(false)}
                      />
                      <div className="absolute left-0 right-0 top-full mt-1.5 z-20 bg-paper-card border border-rule rounded-card shadow-xl max-h-60 overflow-y-auto divide-y divide-rule animate-in fade-in zoom-in-95 duration-100">
                        {filteredAvailableStudents.length === 0 ? (
                          <div className="p-3 text-center text-ink-muted text-xs">
                            No se encontraron estudiantes para &quot;{searchTerm}&quot;
                          </div>
                        ) : (
                          filteredAvailableStudents.map((s) => (
                            <div
                              key={s.id}
                              onClick={() => {
                                setSelectedStudentId(String(s.id));
                                setIsDropdownOpen(false);
                              }}
                              className="p-2.5 hover:bg-paper-muted cursor-pointer transition-colors flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-2.5 overflow-hidden">
                                <div className="w-7 h-7 rounded-full bg-accent-soft text-accent font-bold flex items-center justify-center text-xs shrink-0">
                                  {s.firstName?.[0] || 'E'}
                                  {s.lastName?.[0] || 'S'}
                                </div>
                                <div className="overflow-hidden">
                                  <div className="font-bold text-ink truncate">{s.fullName}</div>
                                  <div className="text-[11px] text-ink-muted truncate">{s.email}</div>
                                </div>
                              </div>
                              {s.studentCode && (
                                <span className="font-mono text-[10px] px-1.5 py-0.5 bg-paper-muted border border-rule rounded text-accent font-bold shrink-0 ml-2">
                                  {s.studentCode}
                                </span>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!selectedStudentId || enrolling || roster.length >= capacity}
              className="px-4 py-2.5 bg-accent text-accent-ink hover:bg-accent-hover font-semibold text-xs rounded-btn inline-flex items-center justify-center gap-1.5 disabled:opacity-50 transition-[background-color] cursor-pointer shrink-0 shadow-xs"
            >
              {enrolling ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Matriculando...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Matricular Alumno</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Section 2: Current Roster Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-ink flex items-center gap-1.5">
              <Users className="w-4 h-4 text-ink-muted" />
              <span>Estudiantes Matriculados Oficiales ({roster.length})</span>
            </span>
            <span className="text-ink-muted">
              {capacity - roster.length > 0
                ? `${capacity - roster.length} cupos libres`
                : 'Cupos agotados'}
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-ink-muted text-xs flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Cargando lista de estudiantes...</span>
            </div>
          ) : roster.length === 0 ? (
            <div className="p-8 text-center bg-paper border border-dashed border-rule rounded-card space-y-2">
              <Users className="w-8 h-8 text-ink-muted mx-auto opacity-50" />
              <p className="text-xs font-semibold text-ink">
                No hay estudiantes matriculados en este curso todavía.
              </p>
              <p className="text-[11px] text-ink-muted">
                Selecciona un estudiante registrado en la barra superior para agregarlo a la lista oficial.
              </p>
            </div>
          ) : (
            <div className="border border-rule rounded-card overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-rule bg-paper-muted text-ink-muted font-semibold">
                    <th className="py-2.5 px-3">Estudiante</th>
                    <th className="py-2.5 px-3">Código</th>
                    <th className="py-2.5 px-3">Contacto</th>
                    <th className="py-2.5 px-3 text-center">WhatsApp</th>
                    <th className="py-2.5 px-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule bg-paper-card">
                  {roster.map((enrollment) => {
                    const student = enrollment.student;
                    if (!student) return null;
                    const fullName =
                      `${student.firstName || ''} ${student.lastName || ''}`.trim() ||
                      student.email;
                    const cleanPhone = student.phoneNumber
                      ? student.phoneNumber.replace(/[^0-9]/g, '')
                      : null;
                    const whatsappUrl = cleanPhone
                      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                          `Hola ${student.firstName || ''}, te contacto desde Cambridge Academy respecto a tu curso ${course.courseName}.`,
                        )}`
                      : null;

                    return (
                      <tr
                        key={enrollment.id}
                        className="hover:bg-paper-muted/50 transition-[background-color]"
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-accent-soft text-accent font-bold flex items-center justify-center text-[10px] shrink-0">
                              {getInitials(fullName)}
                            </div>
                            <div>
                              <div className="font-semibold text-ink">
                                {fullName}
                              </div>
                              <div className="text-[11px] text-ink-muted flex items-center gap-1">
                                <Mail className="w-3 h-3 opacity-60" />
                                <span>{student.email}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3 font-mono font-semibold text-accent">
                          {student.studentCode || '---'}
                        </td>

                        <td className="py-3 px-3 text-ink-muted">
                          {student.phoneNumber ? (
                            <div className="flex items-center gap-1 font-mono text-[11px]">
                              <Phone className="w-3 h-3 opacity-60" />
                              <span>{student.phoneNumber}</span>
                            </div>
                          ) : (
                            <span className="text-ink-muted/50 italic text-[11px]">
                              Sin teléfono
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-center">
                          {whatsappUrl ? (
                            <a
                              href={whatsappUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-2 py-1 bg-success-soft text-success hover:bg-success hover:text-paper font-semibold rounded text-[11px] transition-[background-color,color] cursor-pointer gap-1"
                              title={`Abrir chat con ${fullName}`}
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>Chat</span>
                              <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                            </a>
                          ) : (
                            <span className="text-ink-muted/40 text-[10px] italic">
                              ---
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => setStudentToUnenroll({ id: student.id, name: fullName })}
                            disabled={removingId === student.id}
                            className="p-1.5 text-danger/70 hover:text-danger hover:bg-danger-soft rounded-btn transition-[color,background-color] cursor-pointer disabled:opacity-50"
                            title={`Retirar a ${fullName} de este curso`}
                          >
                            {removingId === student.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-rule flex items-center justify-between text-xs">
          <span className="text-ink-muted">
            Los alumnos matriculados aparecerán automáticamente en las sesiones de examen de este curso.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-paper border border-rule hover:border-rule-strong text-ink font-semibold rounded-btn transition-[border-color] cursor-pointer"
          >
            Listo / Cerrar
          </button>
        </div>
      </div>

      {/* Confirmation Modal to Unenroll Student (No browser alert) */}
      {studentToUnenroll && (
        <div 
          className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => !removingId && setStudentToUnenroll(null)}
        >
          <div 
            className="bg-paper-card border border-rule rounded-card max-w-sm w-full p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-danger-soft text-danger rounded-full shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-ink">
                  ¿Retirar a este estudiante?
                </h4>
                <p className="text-xs text-ink-muted leading-relaxed">
                  ¿Confirmas retirar a <strong className="text-ink font-semibold">{studentToUnenroll.name}</strong> de <strong className="text-ink">{course.courseName}</strong>? Podrás volver a matricularlo cuando desees.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-rule">
              <button
                type="button"
                onClick={() => setStudentToUnenroll(null)}
                disabled={removingId !== null}
                className="px-3.5 py-1.5 bg-paper-card border border-rule text-ink hover:bg-paper-muted rounded-btn text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmUnenroll}
                disabled={removingId !== null}
                className="px-3.5 py-1.5 bg-danger text-white hover:bg-danger/90 rounded-btn text-xs font-bold inline-flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {removingId !== null ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Retirando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Sí, Retirar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
