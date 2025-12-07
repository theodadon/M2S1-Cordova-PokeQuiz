package com.mastercyber.tp1

interface Platform {
    val name: String
}

expect fun getPlatform(): Platform