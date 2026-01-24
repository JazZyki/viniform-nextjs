import { NextResponse } from 'next/server';

export function middleware(request) {
    const session = request.cookies.get('userSession');
    const { pathname } = request.nextUrl;

    // Seznam chráněných stránek
    const protectedPaths = ['/splitter', '/form1', '/form2'];
    const isProtected = protectedPaths.some(path => pathname.startsWith(path));

    if (!session && isProtected) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};