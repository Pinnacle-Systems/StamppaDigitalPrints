export const INITIAL_PAGE_NUMBER = 1;
export const DATA_PER_PAGE = 30;
const BASE_URL = process.env.REACT_APP_SERVER_URL;

export function getImageUrlPath(fileName) {
    return `${BASE_URL + 'retreiveFile/'}${fileName}`
}
