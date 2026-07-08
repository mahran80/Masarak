using System;
using System.Reflection;

class Program
{
    static void Main()
    {
        var asm = Assembly.LoadFrom(@"C:\Users\Lenovo\.nuget\packages\agora-token-generator\1.0.1\lib\net6.0\AgoraIO.dll");
        foreach(var t in asm.GetTypes())
        {
            foreach(var m in t.GetMethods())
            {
                if(m.Name.Contains("Build"))
                {
                    Console.Write(t.Name + "." + m.Name + "(");
                    var ps = m.GetParameters();
                    for(int i=0; i<ps.Length; i++)
                    {
                        Console.Write(ps[i].ParameterType.Name + " " + ps[i].Name + (i<ps.Length-1 ? ", " : ""));
                    }
                    Console.WriteLine(")");
                }
            }
        }
    }
}
