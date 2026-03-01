import api from '@/lib/axios';

const assignmentService = {
    // Tutor/Admin Methods
    createAssignment: async (data) => {
        const response = await api.post('/assignments', data);
        return response.data;
    },
    updateAssignment: async (id, data) => {
        const response = await api.patch(`/assignments/${id}`, data);
        return response.data;
    },
    deleteAssignment: async (id) => {
        const response = await api.delete(`/assignments/${id}`);
        return response.data;
    },
    getSubmissions: async (id) => {
        const response = await api.get(`/assignments/${id}/submissions`);
        return response.data;
    },
    gradeSubmission: async (submissionId, data) => {
        const response = await api.patch(`/assignments/submissions/${submissionId}/grade`, data);
        return response.data;
    },

    // Shared Methods
    getCourseAssignments: async (courseId) => {
        const response = await api.get(`/assignments/course/${courseId}`);
        return response.data;
    },
    getAssignmentDetails: async (id) => {
        const response = await api.get(`/assignments/${id}`);
        return response.data;
    },

    // Student Methods
    submitAssignment: async (id, data) => {
        const response = await api.post(`/assignments/${id}/submit`, data);
        return response.data;
    }
};

export default assignmentService;
