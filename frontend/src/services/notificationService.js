import api from "./api";

export const getNotifications = async(page=1, limit=20, options={}) => {
    const response = await api.get("/notifications", {
        params: {page,limit,filter: options.filter || "all",},
        
        signal:options.signal,
    });
    
    return response.data;
}

export const getUnreadNotificationCount = async(options={}) => {
    const response = await api.get("/notifications/unread-count", {
        signal:options.signal,
    });
    
    return response.data;
}

export const markNotificationRead = async(notificationId) => {
    const response = await api.patch(`/notifications/${notificationId}/read`)
    
    return response.data;
}

export const markAllNotificationsRead = async() => {
    const response = await api.get("/notifications/read-all")
    
    return response.data;
}